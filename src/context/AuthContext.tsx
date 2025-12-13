// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User as AppUser } from '@/types';
import { supabase } from '@/lib/supabaseClient'; // adapt path if needed
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; errorCode?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  // keep existing signOut for compatibility
  signOut: () => Promise<void>;
  // alias preferred by some pages/components
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // fetch profile from 'profiles' table by auth user id
  const fetchProfile = useCallback(async (uid: string | null) => {
    if (!uid) {
      setUser(null);
      return;
    }

    try {
      // get email from auth session (profiles table doesn't store email)
      const session = await supabase.auth.getSession();
      const email = session.data.session?.user?.email ?? '';

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar, created_at')
        .eq('id', uid)
        .single();

      // supabase error for "no rows" may appear — allow that
      if (error && (error as any).code !== 'PGRST116') {
        // PGRST116 is "No rows found" in some setups — ignore if that's expected
        throw error;
      }

      if (data) {
        const userObj: AppUser = {
          id: data.id,
          name: (data as any).full_name ?? '',
          email, // always a string from session above (may be empty)
          avatar: (data as any).avatar ?? null,
        };

        setUser(userObj);
      } else {
        // profile row not found — still set a minimal user object if session exists
        setUser({
          id: uid,
          name: '',
          email,
          avatar: null,
        } as AppUser);
      }
    } catch (err) {
      console.error('fetchProfile error', err);
      setUser(null);
    }
  }, []);

  // create profile row after sign up (or upsert)
  const createOrUpdateProfile = useCallback(async (uid: string, full_name: string, avatar?: string) => {
    const payload = {
      id: uid,
      full_name,
      avatar: avatar ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(payload); // v2-compliant

    if (error) throw error;
  }, []);

  // signUp -> supabase.auth.signUp + create profile
  const signUp = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name } // optional metadata
        }
      });

      if (error) throw error;

      // After signUp the user might need to confirm email - user object present if immediate session.
      const userId = data.user?.id ?? null;
      if (userId) {
        // Upsert profile row
        await createOrUpdateProfile(userId, name);
        await fetchProfile(userId);
      }

      toast({ title: 'Account created', description: 'Check your email to confirm (if required).' });
      return true;
    } catch (err: any) {
      console.error('signUp error', err);
      toast({ title: 'Signup failed', description: err.message ?? 'Unable to create account' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [createOrUpdateProfile, fetchProfile]);

  // signIn -> supabase.auth.signInWithPassword
  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<{ ok: boolean; errorCode?: string }> => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('signIn error', error);

        toast({
          title: 'Sign in failed',
          description: error.message || 'Unable to sign in'
        });

        return { ok: false, errorCode: (error as any).code };
      }

      const uid = data.user?.id ?? null;
      await fetchProfile(uid);

      toast({ title: 'Signed in', description: 'Welcome back!' });

      return { ok: true };

    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  // signOut (keeps original name)
  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      toast({ title: 'Logged out', description: 'You have been signed out.' });
    } catch (err) {
      console.error('signOut error', err);
      toast({ title: 'Logout failed', description: 'Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // logout alias (some pages expect logout())
  const logout = useCallback(async () => {
    // just call signOut to keep one implementation
    return signOut();
  }, [signOut]);

  // password reset
  const sendPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password' // optional
      });
      if (error) throw error;
      toast({ title: 'Password Reset', description: 'Check your email for reset instructions.' });
      return true;
    } catch (err: any) {
      console.error('sendPasswordReset error', err);
      toast({ title: 'Reset failed', description: err.message ?? 'Unable to send reset email' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // manual refresh
  const refreshProfile = useCallback(async () => {
    const session = await supabase.auth.getSession();
    const uid = session.data.session?.user?.id ?? null;
    await fetchProfile(uid);
  }, [fetchProfile]);

  // on mount: sync session & listen for auth changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id ?? null;
      if (mounted) await fetchProfile(uid);
      setIsLoading(false);
    })();

    // subscribe to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      fetchProfile(uid);
    });

    return () => {
      mounted = false;
      // unsubscribe if present
      try {
        listener.subscription.unsubscribe();
      } catch (e) {
        // ignore unsubscribe errors
      }
    };
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      signIn,
      signUp,
      signOut,
      // alias for pages that call logout()
      logout,
      sendPasswordReset,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
