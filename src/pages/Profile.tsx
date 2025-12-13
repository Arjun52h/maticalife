// src/pages/Profile.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Edit3,
    Shield,
    Bell,
    LogOut,
    Package,
    Heart,
    Key,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

type ProfileRow = {
    id: string;
    full_name?: string | null;
    avatar?: string | null; // stores storage path (recommended) OR legacy public URL
    created_at?: string | null;
    updated_at?: string | null;
};

type AddressRow = {
    id: number;
    user_id: string;
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    phone?: string | null;
    is_default?: boolean | null;
};

const Profile: React.FC = () => {
    const { user, isAuthenticated, signOut } = useAuth();
    const navigate = useNavigate();

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);

    const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const [profile, setProfile] = useState<ProfileRow | null>(null);
    const [address, setAddress] = useState<AddressRow | null>(null);

    // avatar upload UI state
    const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Preview URL so user sees immed preview after upload
    const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null);

    // local form state (kept separate so edits are local until saved)
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        pincode: '',
        avatar: '', // will store the storage PATH (recommended), or legacy full URL if present
    });

    // keep a snapshot of last-saved form to detect changes and support cancel
    const lastSavedRef = useRef<typeof form | null>(null);

    // keep track of the old avatar storage path so we can delete it after successful save
    const oldAvatarPathRef = useRef<string | null>(null);

    // ---------- Helper utilities ----------

    const extractStoragePath = (value?: string | null): string | null => {
        if (!value) return null;
        // If it's already a relative path (no "http" and no '/storage/v1/object/public'), assume it's a storage path.
        if (!value.startsWith('http')) {
            return value;
        }
        // If it's a Supabase public URL, extract the tail after the bucket prefix:
        const publicPrefix = '/storage/v1/object/public/avatars/';
        try {
            const url = new URL(value);
            const idx = url.pathname.indexOf(publicPrefix);
            if (idx !== -1) {
                return decodeURIComponent(url.pathname.slice(idx + publicPrefix.length));
            }
        } catch (e) {
            // not a valid URL
        }
        return null;
    };


    // get public url from a storage path (or null)
    const getPublicUrlFromPath = (path?: string | null): string | null => {
        if (!path) return null;
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        return data?.publicUrl ?? null;
    };

    // ---------- Load profile ----------

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoadingProfile(true);
            try {
                if (!user?.id) {
                    if (!mounted) return;
                    setProfile(null);
                    setAddress(null);
                    setForm((f) => ({ ...f, email: user?.email ?? '' }));
                    lastSavedRef.current = null;
                    setPreviewAvatarUrl(null);
                    return;
                }

                // fetch profile row
                const { data: profData, error: profErr } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar, created_at, updated_at')
                    .eq('id', user.id)
                    .limit(1)
                    .maybeSingle();

                if (profErr) {
                    console.debug('Profile select error', profErr);
                }

                // fetch default address (if any)
                const { data: addrRows, error: addrErr } = await supabase
                    .from('addresses')
                    .select('id, user_id, line1, line2, city, state, postal_code, phone, is_default')
                    .eq('user_id', user.id)
                    .eq('is_default', true)
                    .limit(1);

                if (addrErr) {
                    console.debug('addresses select error', addrErr);
                }

                const row = profData ?? null;
                const addr = (addrRows && addrRows[0]) ?? null;

                if (!mounted) return;
                setProfile(row);
                setAddress(addr);

                const initialForm = {
                    name: row?.full_name ?? user?.name ?? '',
                    email: user?.email ?? '',
                    phone: addr?.phone ?? '',
                    address: addr?.line1 ?? '',
                    city: addr?.city ?? '',
                    pincode: addr?.postal_code ?? '',
                    // store DB value directly; if it's a public URL we'll keep it (legacy),
                    // otherwise it should be the storage path (recommended).
                    avatar: row?.avatar ?? '',
                };

                setForm(initialForm);
                lastSavedRef.current = initialForm;

                // compute preview url: if avatar is storage path -> getPublicUrl, else if avatar is full url -> use it
                const storagePath = extractStoragePath(row?.avatar ?? undefined);
                const preview = storagePath ? getPublicUrlFromPath(storagePath) : (row?.avatar ?? null);
                setPreviewAvatarUrl(preview);

                // reset oldAvatarPathRef to current storage path (if any)
                oldAvatarPathRef.current = storagePath;
            } catch (err) {
                console.error('Profile load exception', err);
                toast({ title: 'Unable to load profile', description: 'Something went wrong while loading your profile.' });
            } finally {
                if (mounted) setLoadingProfile(false);
            }
        };

        load();

        return () => {
            mounted = false;
        };
    }, [user?.id, user?.email, user?.name]);

    // helper: initials for avatar fallback
    const initials = useMemo(() => {
        const n = form.name || user?.name || '';
        if (!n) return 'U';
        return n
            .split(' ')
            .map((p) => p[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }, [form.name, user?.name]);

    // Utility: returns true if form changed since last saved snapshot
    const hasChanges = () => {
        const last = lastSavedRef.current;
        if (!last) return true; // no snapshot => editable
        return (
            last.name !== form.name ||
            last.phone !== form.phone ||
            last.address !== form.address ||
            last.city !== form.city ||
            last.pincode !== form.pincode ||
            last.avatar !== form.avatar
        );
    };

    // ---------- Storage helpers ----------

    // returns storage path (relative to bucket) or null
    const uploadAvatarToStorage = async (file: File, userId: string): Promise<string | null> => {
        try {
            const ext = file.name.split('.').pop() ?? 'jpg';
            // path relative to bucket 'avatars'
            const path = `${userId}/${Date.now()}.${ext}`;

            const { error: upErr } = await supabase.storage
                .from('avatars')
                .upload(path, file, { cacheControl: '3600', upsert: true });

            if (upErr) {
                console.error('avatar upload error', upErr);
                return null;
            }

            return path; // return the storage path relative to bucket
        } catch (err) {
            console.error('uploadAvatarToStorage exception', err);
            return null;
        }
    };


    const deleteAvatarPathIfExists = async (path?: string | null) => {
        if (!path) return;
        // only attempt to remove if it doesn't look like an external URL (simple check)
        if (path.startsWith('http')) return;
        try {
            const { error } = await supabase.storage.from('avatars').remove([path]);
            if (error) {
                console.debug('Could not remove old avatar', error);
            } else {
                console.debug('Old avatar removed:', path);
            }
        } catch (err) {
            console.debug('remove avatar exception', err);
        }
    };


    // ---------- Avatar UI handlers ----------

    // handle picking an avatar file (opens file picker)
    const handlePickAvatar = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    // once file is picked: upload and update form.avatar with the storage PATH and set preview URL
    const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) return;

        if (!file.type.startsWith('image/')) {
            toast({ title: 'Invalid file', description: 'Please select an image file.' });
            e.currentTarget.value = '';
            return;
        }

        try {
            setUploadingAvatar(true);

            // upload -> returns storage path relative to bucket
            const newPath = await uploadAvatarToStorage(file, user.id);
            if (!newPath) {
                toast({ title: 'Upload failed', description: 'Could not upload avatar. Try again.' });
                e.currentTarget.value = '';
                return;
            }

            // immediate preview
            const publicUrl = getPublicUrlFromPath(newPath);
            setPreviewAvatarUrl(publicUrl);
            setForm((s) => ({ ...s, avatar: newPath }));

            // capture previous path (relative path or null)
            const previousPath = oldAvatarPathRef.current;

            // Attempt to persist avatar to profiles table immediately
            try {
                const profilePayload = {
                    id: user.id,
                    avatar: newPath,
                    updated_at: new Date().toISOString(),
                };

                const { data: profData, error: profErr } = await supabase
                    .from('profiles')
                    .upsert(profilePayload, { onConflict: 'id' })
                    .select()
                    .maybeSingle();

                if (profErr) {
                    // Common cause: missing INSERT policy under RLS
                    console.error('profiles upsert error (avatar autosave)', profErr);
                    toast({ title: 'Auto-save failed', description: profErr.message ?? 'Avatar uploaded but not saved to profile.' });
                    // keep the preview so user sees uploaded image; they can still hit Save
                    return;
                }

                // success: update local state to reflect DB
                const savedProfile = profData ?? { id: user.id, avatar: newPath, updated_at: profilePayload.updated_at } as any;
                setProfile(savedProfile);

                // set lastSavedRef so hasChanges() considers avatar saved
                lastSavedRef.current = { ...(lastSavedRef.current ?? { name: form.name, email: form.email, phone: form.phone, address: form.address, city: form.city, pincode: form.pincode }), avatar: newPath };

                // update oldAvatarPathRef to the newly saved path
                oldAvatarPathRef.current = newPath;

                toast({ title: 'Avatar saved', description: 'You got yourself a new avatar! (〜￣▽￣)〜' });

                // delete previous file if it exists and is different from newPath
                try {
                    if (previousPath && previousPath !== newPath) {
                        // only attempt remove when it's storage path (no http)
                        await deleteAvatarPathIfExists(previousPath);
                        console.debug('Deleted previous avatar:', previousPath);
                    }
                } catch (delErr) {
                    console.debug('Failed to delete previous avatar', delErr);
                }
            } catch (err) {
                console.error('avatar autosave exception', err);
                toast({ title: 'Auto-save error', description: 'Avatar uploaded but saving to profile encountered an error.' });
            }
        } finally {
            setUploadingAvatar(false);
            e.currentTarget.value = '';
        }
    };


    const handleRemoveAvatar = async () => {
        if (!user?.id) return;

        // determine the storage path of the current avatar (may be from form or profile)
        const currentStoragePath =
            extractStoragePath(form.avatar) ??
            extractStoragePath(profile?.avatar) ??
            null;

        // optimistic UI update
        setForm((s) => ({ ...s, avatar: '' }));
        setPreviewAvatarUrl(null);

        // show immediate toast so user knows something happened
        toast({ title: 'Avatar removed', description: 'Removing avatar…' });

        // Persist removal to DB and then delete file from storage (if any)
        setUploadingAvatar(true);
        try {
            // upsert profile with avatar = null (insert or update)
            const payload = {
                id: user.id,
                avatar: null,
                updated_at: new Date().toISOString(),
            };

            const { data: profData, error: profErr } = await supabase
                .from('profiles')
                .upsert(payload, { onConflict: 'id' })
                .select()
                .maybeSingle();

            if (profErr) {
                console.error('profiles upsert error (remove avatar)', profErr);
                toast({ title: 'Remove failed', description: profErr.message ?? 'Could not remove avatar from profile.' });
                // revert UI to previous avatar since DB failed (optional)
                const revertAvatar = profile?.avatar ?? null;
                setForm((s) => ({ ...s, avatar: revertAvatar ?? '' }));
                const preview = extractStoragePath(revertAvatar) ? getPublicUrlFromPath(revertAvatar!) : (revertAvatar ?? null);
                setPreviewAvatarUrl(preview);
                return;
            }

            // success: update local profile state and lastSavedRef
            const savedProfile = profData ?? { id: user.id, avatar: null, updated_at: payload.updated_at } as any;
            setProfile(savedProfile);

            lastSavedRef.current = {
                ...(lastSavedRef.current ?? {
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    address: form.address,
                    city: form.city,
                    pincode: form.pincode,
                }),
                avatar: '',
            };

            // update oldAvatarPathRef (we removed it)
            oldAvatarPathRef.current = null;

            toast({ title: 'Avatar removed', description: 'Your avatar was removed from your profile.' });

            // only attempt to delete the file if we had a storage path (not a full external URL)
            if (currentStoragePath) {
                try {
                    await deleteAvatarPathIfExists(currentStoragePath);
                    console.debug('Deleted avatar file:', currentStoragePath);
                    toast({ title: 'Avatar file deleted', description: 'Avatar file removed from storage.' });
                } catch (delErr) {
                    console.debug('Failed to delete avatar file', delErr);
                    // non-fatal: the DB is already updated; user won't see avatar but file may remain
                }
            }
        } catch (err) {
            console.error('handleRemoveAvatar exception', err);
            toast({ title: 'Remove failed', description: 'An unexpected error occurred while removing avatar.' });
        } finally {
            setUploadingAvatar(false);
        }
    };



    // ---------- Validation & Save ----------

    const validateBeforeSave = (): { ok: boolean; message?: string } => {
        // Phone: allow optional leading '+' plus digits, min 6 digits typical
        const phone = form.phone?.replace(/\s/g, '') ?? '';
        if (phone && !/^\+?\d{6,15}$/.test(phone)) {
            return { ok: false, message: 'Phone number appears invalid.' };
        }

        // Pincode: if provided must be 6 digits
        if (form.pincode && !/^\d{6}$/.test(form.pincode)) {
            return { ok: false, message: 'PIN code must be 6 digits.' };
        }

        // Name: required
        if (!form.name?.trim()) {
            return { ok: false, message: 'Full name is required.' };
        }

        return { ok: true };
    };

    const handleSave = async () => {
        if (!user?.id) {
            toast({ title: 'Not signed in', description: 'Please sign in to update your profile' });
            return;
        }

        if (!hasChanges()) {
            toast({ title: 'No changes', description: 'There is nothing to save.' });
            setIsEditing(false);
            return;
        }

        const valid = validateBeforeSave();
        if (!valid.ok) {
            toast({ title: 'Validation failed', description: valid.message });
            return;
        }

        setSaving(true);

        try {
            // 1) upsert profiles table: store storage PATH (recommended)
            const profilePayload = {
                id: user.id,
                full_name: form.name || null,
                avatar: form.avatar ? form.avatar : null,
                updated_at: new Date().toISOString(),
            };

            const { data: profData, error: profErr } = await supabase
                .from('profiles')
                .upsert(profilePayload, { onConflict: 'id' })
                .select()
                .maybeSingle();

            if (profErr) {
                console.error('profiles upsert error', profErr);
                toast({ title: 'Save failed', description: profErr.message ?? 'Could not save profile' });
                return;
            }

            // 2) upsert default address — if we have an existing default, update it; otherwise insert new.
            try {
                const { data: existingAddresses, error: addrSelectErr } = await supabase
                    .from('addresses')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('is_default', true)
                    .limit(1);

                if (addrSelectErr) {
                    console.debug('addresses select error', addrSelectErr);
                    // not fatal
                }

                const addrPayload: any = {
                    user_id: user.id,
                    label: 'Home',
                    full_name: form.name || user.name || '',
                    phone: form.phone || null,
                    line1: form.address || null,
                    line2: null,
                    city: form.city || null,
                    state: 'N/A', // adjust if you collect state
                    postal_code: form.pincode || null,
                    country: 'India',
                    is_default: true,
                    updated_at: new Date().toISOString(),
                };

                const defaultAddr = (existingAddresses && existingAddresses[0]) ?? null;

                if (defaultAddr && defaultAddr.id) {
                    const { error: addrUpdateErr } = await supabase
                        .from('addresses')
                        .update(addrPayload)
                        .eq('id', defaultAddr.id);

                    if (addrUpdateErr) {
                        console.error('addresses update error', addrUpdateErr);
                        toast({ title: 'Partial save', description: 'Profile saved but address update failed.' });
                    }
                } else {
                    const { error: addrInsertErr } = await supabase
                        .from('addresses')
                        .insert([addrPayload]);

                    if (addrInsertErr) {
                        console.error('addresses insert error', addrInsertErr);
                        toast({ title: 'Partial save', description: 'Profile saved but address insert failed.' });
                    }
                }
            } catch (addrEx) {
                console.error('Address upsert exception', addrEx);
                toast({ title: 'Partial save', description: 'Profile saved but address update failed.' });
            }

            // capture previous path BEFORE updating oldAvatarPathRef
            const previousPath = oldAvatarPathRef.current; // path that existed before this save
            const newAvatarPath = profilePayload.avatar ?? null;

            const newProfileState = profData ?? {
                id: user.id,
                full_name: profilePayload.full_name ?? undefined,
                avatar: profilePayload.avatar ?? undefined,
                updated_at: profilePayload.updated_at,
            } as any;

            setProfile(newProfileState);

            // now update oldAvatarPathRef to the newly saved path
            oldAvatarPathRef.current = extractStoragePath(newProfileState.avatar);

            // delete previous file if it was a storage path and different from the new one
            try {
                if (previousPath && previousPath !== newAvatarPath) {
                    await deleteAvatarPathIfExists(previousPath);
                    toast({ title: 'Old avatar deleted', description: 'Avatar file was removed from storage.' });
                }
            } catch (delErr) {
                console.debug('Old avatar deletion issue', delErr);
            }

            // update preview URL to match saved avatar
            const newPreview = extractStoragePath(newProfileState.avatar) ? getPublicUrlFromPath(newProfileState.avatar!) : (newProfileState.avatar ?? null);
            setPreviewAvatarUrl(newPreview);

            // set address local state to last-saved snapshot (optimistic)
            setAddress((prev) => ({
                ...(prev ?? {}),
                line1: form.address || null,
                city: form.city || null,
                phone: form.phone || null,
                postal_code: form.pincode || null,
            } as AddressRow));

            lastSavedRef.current = { ...form };
            setIsEditing(false);
            toast({ title: 'Profile saved', description: 'Your profile has been updated.' });
        } catch (err) {
            console.error('Save exception', err);
            toast({ title: 'Save failed', description: 'An unexpected error occurred' });
        } finally {
            setSaving(false);
        }
    };

    // Send password reset email (safer than inline password change)
    const handleSendPasswordReset = async () => {
        const email = form.email || user?.email;
        if (!email) {
            toast({ title: 'No email', description: 'Your account does not have an email' });
            return;
        }

        try {
            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password',
            });
            if (error) {
                console.error('resetPassword error', error);
                toast({ title: 'Unable to send reset', description: error.message ?? 'Please try again' });
            } else {
                toast({ title: 'Reset email sent', description: 'Check your inbox for instructions.' });
            }
        } catch (err) {
            console.error('resetPassword exception', err);
            toast({ title: 'Unable to send reset', description: 'Please try again later.' });
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/');
        } catch (err) {
            console.error('logout failed', err);
            navigate('/');
        }
    };

    // Cancel editing -> reset form to profile state
    const handleCancelEdit = () => {
        setIsEditing(false);
        if (lastSavedRef.current) {
            setForm({ ...lastSavedRef.current });
            // reset preview to last-saved
            const preview = extractStoragePath(lastSavedRef.current.avatar) ? getPublicUrlFromPath(lastSavedRef.current.avatar) : (lastSavedRef.current.avatar || null);
            setPreviewAvatarUrl(preview);
        } else {
            setForm({
                name: profile?.full_name ?? user?.name ?? '',
                email: user?.email ?? '',
                phone: address?.phone ?? '',
                address: address?.line1 ?? '',
                city: address?.city ?? '',
                pincode: address?.postal_code ?? '',
                avatar: profile?.avatar ?? '',
            });
            // reset preview to profile avatar
            const preview = extractStoragePath(profile?.avatar) ? getPublicUrlFromPath(extractStoragePath(profile?.avatar)!) : (profile?.avatar ?? null);
            setPreviewAvatarUrl(preview);
        }
    };

    // Not signed in UI
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-background">
                <Helmet>
                    <title>My Account | Matica.life</title>
                </Helmet>
                <Header onOpenCart={() => setIsCartOpen(true)} onOpenAuth={() => setIsAuthOpen(true)} />
                <main className="pt-24 pb-16 px-4">
                    <div className="max-w-md mx-auto text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <User className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-3">Sign in to view your account</h1>
                        <p className="text-muted-foreground mb-8">Access your profile, orders, and preferences</p>
                        <Button onClick={() => setIsAuthOpen(true)} size="lg" className="px-8">
                            Sign In
                        </Button>
                    </div>
                </main>
                <Footer />
                <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
                <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
            </div>
        );
    }

    // compute avatar src (preview wins, else compute from stored path or legacy URL)
    const avatarSrc =
        previewAvatarUrl ||
        (extractStoragePath(form.avatar) ? getPublicUrlFromPath(form.avatar) : (form.avatar || null)) ||
        (extractStoragePath(profile?.avatar ?? undefined) ? getPublicUrlFromPath(profile!.avatar!) : (profile?.avatar ?? null));

    // Main profile UI
    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>My Account | Matica.life</title>
                <meta name="description" content="Manage your Matica.life account, profile settings, and preferences." />
            </Helmet>

            <Header onOpenCart={() => setIsCartOpen(true)} onOpenAuth={() => setIsAuthOpen(true)} />

            <main className="pt-24 pb-16">
                {/* Hero */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12">
                    <div className="container mx-auto px-4 relative">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="relative group">
                                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background shadow-xl">
                                    {avatarSrc ? (
                                        <AvatarImage src={avatarSrc} />
                                    ) : (
                                        <AvatarFallback className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                                            {initials}
                                        </AvatarFallback>
                                    )}
                                </Avatar>

                                <button
                                    className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Edit avatar"
                                    onClick={handlePickAvatar}
                                    aria-label="Edit avatar"
                                    disabled={uploadingAvatar}
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>

                                {form.avatar && (
                                    <button
                                        className="absolute bottom-0 left-0 p-2 rounded-full bg-red-500 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={handleRemoveAvatar}
                                        disabled={uploadingAvatar}
                                        title="Remove avatar"
                                    >
                                        ✕
                                    </button>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarFileChange}
                                    className="hidden"
                                />
                            </div>

                            <div className="text-center md:text-left">
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                                    {form.name || user?.name}
                                </h1>
                                <p className="text-muted-foreground">{form.email || user?.email}</p>

                                <div className="mt-4 flex justify-center md:justify-start">
                                    {!isEditing ? (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="rounded-full px-4"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            <Edit3 className="w-4 h-4 mr-2" />
                                            Edit Profile
                                        </Button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                                                Cancel
                                            </Button>
                                            <Button size="sm" onClick={handleSave}>
                                                Save
                                            </Button>
                                        </div>
                                    )}
                                </div>


                                <div className="flex gap-2 mt-4 justify-center md:justify-start">
                                    <Button variant="outline" size="sm" onClick={() => navigate('/orders')}>
                                        <Package className="w-4 h-4 mr-2" />
                                        My Orders
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => navigate('/wishlist')}>
                                        <Heart className="w-4 h-4 mr-2" />
                                        Wishlist
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 py-8">
                    <Tabs defaultValue="profile" className="space-y-6">
                        <TabsList
                            className="bg-muted/50 flex w-full overflow-x-auto overflow-y-hidden scrollbar-hide rounded-lg p-1 h-12 items-center gap-1"
                        >
                            {[
                                { value: 'profile', label: 'Profile', Icon: User },
                                { value: 'security', label: 'Security', Icon: Shield },
                                { value: 'notifications', label: 'Notifications', Icon: Bell },
                            ].map(({ value, label, Icon }) => (
                                <TabsTrigger
                                    key={value}
                                    value={value}
                                    className="relative group flex items-center justify-center gap-2 h-10 px-3 sm:px-4 shrink-0 data-[state=active]:bg-background focus:outline-none focus-visible:ring-0"
                                >
                                    {/* Icon (always visible) */}
                                    <Icon className="w-5 h-5" />

                                    {/* Text (desktop only) */}
                                    <span className=" sm:inline max-[375px]:hidden text-sm">
                                        {label}
                                    </span>

                                    {/* Tooltip label (mobile long-press / hover) */}
                                    <span
                                        className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100 sm:hidden whitespace-nowrap"
                                    >
                                        {label}
                                    </span>
                                </TabsTrigger>
                            ))}
                        </TabsList>


                        {/* <TabsList className="bg-muted/50 p-1 pl-16 flex w-full overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide rounded-lg snap-x snap-mandatory" >
                            <TabsTrigger value="profile" className="data-[state=active]:bg-background flex items-center gap-2 px-3 px-4 py-2 shrink-0 snap-start">
                                <User className="w-4 h-4" /> Profile
                            </TabsTrigger>
                            <TabsTrigger value="security" className="data-[state=active]:bg-background flex items-center gap-2 px-3 px-4 py-2 shrink-0 snap-start">
                                <Shield className="w-4 h-4" /> Security
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className="data-[state=active]:bg-background flex items-center gap-2 px-3 px-4 py-2 shrink-0 snap-start">
                                <Bell className="w-4 h-4" /> Notifications
                            </TabsTrigger>
                        </TabsList> */}

                        <TabsContent value="profile" className="space-y-6">
                            <Card className="border-border/50 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Personal Information</CardTitle>
                                        <CardDescription>Update your personal details here</CardDescription>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="flex items-center gap-2 text-muted-foreground">
                                                <User className="w-4 h-4" /> Full Name
                                            </Label>
                                            <Input id="name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} disabled={!isEditing || saving} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="flex items-center gap-2 text-muted-foreground">
                                                <Mail className="w-4 h-4" /> Email
                                            </Label>
                                            <Input id="email" type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} disabled />
                                            <p className="text-xs text-muted-foreground mt-1">Email is managed by authentication and cannot be changed here.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="flex items-center gap-2 text-muted-foreground">
                                                <Phone className="w-4 h-4" /> Phone
                                            </Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                placeholder="+91 98765 43210"
                                                value={form.phone}
                                                onChange={(e) => {
                                                    // allow only digits and optional leading '+'
                                                    let v = e.target.value.replace(/[^\d+]/g, '');
                                                    // only allow one leading '+'
                                                    if (v.includes('+')) {
                                                        v = '+' + v.replace(/\+/g, '');
                                                    }
                                                    // limit length to 15 (E.164)
                                                    if (v.length > 16) v = v.slice(0, 16);
                                                    setForm((s) => ({ ...s, phone: v }));
                                                }}
                                                disabled={!isEditing || saving}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="pincode" className="flex items-center gap-2 text-muted-foreground">PIN Code</Label>
                                            <Input
                                                id="pincode"
                                                placeholder="400001"
                                                value={form.pincode}
                                                onChange={(e) => {
                                                    const digits = e.target.value.replace(/\D/g, '').slice(0, 6); // max 6 digits
                                                    setForm((s) => ({ ...s, pincode: digits }));
                                                }}
                                                inputMode="numeric"
                                                disabled={!isEditing || saving}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address" className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="w-4 h-4" /> Address
                                        </Label>
                                        <Input id="address" placeholder="123 Main Street" value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} disabled={!isEditing || saving} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="city">City</Label>
                                            <Input id="city" placeholder="Mumbai" value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} disabled={!isEditing || saving} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border/50 shadow-sm">
                                <CardHeader>
                                    <CardTitle>Account Actions</CardTitle>
                                    <CardDescription>Useful account-level actions</CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                                        <div>
                                            <p className="font-medium">Send password reset</p>
                                            <p className="text-sm text-muted-foreground">We’ll email you a secure link to reset your password.</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={handleSendPasswordReset}><Key className="w-4 h-4 mr-2" />Send reset</Button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                                        <div>
                                            <p className="font-medium">Default shipping address</p>
                                            <p className="text-sm text-muted-foreground">Manage your saved addresses under Shipping (not yet implemented)</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => toast({ title: 'Addresses', description: 'Address management not implemented yet.' })}>Manage</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="security" className="space-y-6">
                            <Card className="border-border/50 shadow-sm">
                                <CardHeader>
                                    <CardTitle>Password & Security</CardTitle>
                                    <CardDescription>Manage your password and security settings</CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                                        <div>
                                            <p className="font-medium">Password</p>
                                            <p className="text-sm text-muted-foreground">Change password via reset email</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={handleSendPasswordReset}><Key className="w-4 h-4 mr-2" />Send reset</Button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                                        <div>
                                            <p className="font-medium">Two-Factor Authentication</p>
                                            <p className="text-sm text-muted-foreground">Add an extra layer of security (not yet implemented)</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => toast({ title: '2FA', description: 'Two-Factor Authentication not implemented yet.' })}>Enable</Button>
                                    </div>

                                    <div className="mt-4">
                                        <Button variant="destructive" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" />Sign Out</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="notifications" className="space-y-6">
                            <Card className="border-border/50 shadow-sm">
                                <CardHeader>
                                    <CardTitle>Email Notifications</CardTitle>
                                    <CardDescription>Choose what updates you want to receive</CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    {[
                                        { title: 'Order Updates', desc: 'Get notified about your order status', key: 'orders' },
                                        { title: 'New Arrivals', desc: 'Be the first to know about new products', key: 'new' },
                                        { title: 'Promotions & Offers', desc: 'Receive exclusive deals and discounts', key: 'promo' },
                                        { title: 'Newsletter', desc: 'Weekly curated content and tips', key: 'news' },
                                    ].map((n, i) => (
                                        <div key={n.key} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                                            <div>
                                                <p className="font-medium">{n.title}</p>
                                                <p className="text-sm text-muted-foreground">{n.desc}</p>
                                            </div>
                                            <input type="checkbox" defaultChecked={i < 2} className="w-5 h-5 accent-primary" />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>

            <Footer />
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        </div>
    );
};

export default Profile;
