import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ForgotPasswordModal from './auth/ForgotPasswordModal';
import { useLocation, useNavigate } from "react-router-dom";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [cooldownInterval, setCooldownInterval] = useState<number | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as any)?.redirectTo || "/";

  const handleGoogleSignIn = async () => {
    if (!signInWithProvider) return;
    setOauthLoading(true);
    try {
      await signInWithProvider('google');
    } catch (err) {
      console.error('Google OAuth error', err);
    } finally {
      setOauthLoading(false);
    }
  };


  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Updated auth hooks (real supabase-backed auth)
  const auth = useAuth();
  // guard: context might not have signInWithProvider yet
  const signIn = (auth as any).signIn ?? auth.signIn;
  const signUp = (auth as any).signUp ?? auth.signUp;
  const sendPasswordReset = (auth as any).sendPasswordReset ?? auth.sendPasswordReset;
  const signInWithProvider = (auth as any).signInWithProvider as ((p: string) => Promise<boolean>) | undefined;
  const isLoading = auth.isLoading;

  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 640 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640); // <=640px is typical mobile breakpoint
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startCooldown = () => {
    setCooldown(60);

    const interval = window.setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setCooldownInterval(interval);
  };

  // Cleanup interval when modal closes
  useEffect(() => {
    return () => {
      if (cooldownInterval) clearInterval(cooldownInterval);
    };
  }, [cooldownInterval]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;

    if (isLogin) {
      // support both boolean return and { ok, errorCode } return shapes from signIn
      const res = await signIn(formData.email, formData.password) as any;

      let ok = false;
      let errorCode: string | undefined;

      if (typeof res === 'boolean') {
        ok = res;
      } else if (res && typeof res === 'object') {
        // common shapes: { ok: boolean } or { error: {...} } or { data, error }
        if (typeof res.ok === 'boolean') ok = res.ok;
        else if ('data' in res && res.data?.user) ok = true;
        else if ('error' in res && !res.error) ok = true;
        else ok = !!res; // fallback
        errorCode = res.errorCode ?? res?.error?.code ?? undefined;
      } else {
        ok = !!res;
      }

      // Cooldown ONLY for actual rate-limit errors
      if (!ok && ["over_email_send_rate_limit", "too_many_requests", "rate_limited"].includes(errorCode || "")) {
        startCooldown();
      }

      if (ok) {
        onClose();
        setFormData({ name: '', email: '', password: '' });

        // Redirect to the page user intended
        navigate(redirectTo);
      }

    } else {
      const ok = await signUp(formData.name, formData.email, formData.password);
      if (ok) {
        onClose();
        setFormData({ name: '', email: '', password: '' });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className={`w-full max-w-md bg-background rounded-2xl shadow-strong overflow-hidden animate-scale-in ${isMobile ? 'max-h-[90vh] overflow-y-auto my-1' : ''}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="max-h-[90vh] overflow-y-auto my-1">
            {/* Header */}
            <div className="relative p-6 pb-4 bg-gradient-to-br from-primary/10 to-accent/10">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>

              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <span className="font-display text-3xl font-bold text-primary">M</span>
              </div>

              <h2 className="font-display text-2xl font-semibold text-foreground">
                {isLogin ? 'Welcome Back!' : 'Create Account'}
              </h2>
              <p className="text-muted-foreground mt-1">
                {isLogin ? 'Sign in to access your account' : 'Join Matica.life for exclusive offers'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      className="pl-10 h-12 bg-muted/50 border-border focus:bg-background transition-colors"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="pl-10 h-12 bg-muted/50 border-border focus:bg-background transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 h-12 bg-muted/50 border-border focus:bg-background transition-colors"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>

              {isLogin && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => setForgotPasswordOpen(true)}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 btn-primary font-semibold"
                disabled={isLoading || cooldown > 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : cooldown > 0 ? (
                  `Wait ${cooldown}s`
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  type="button"
                  className="h-11"
                  onClick={handleGoogleSignIn}
                  disabled={oauthLoading}
                >
                  {oauthLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (
                    <>
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Google
                    </>
                  )}
                </Button>


                <Button variant="outline" type="button" className="h-11">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  Facebook
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-6">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  className="text-primary font-semibold hover:underline"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Forgot password modal */}
      <ForgotPasswordModal
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        initialEmail={formData.email}
      />
    </>
  );
};

export default AuthModal;
