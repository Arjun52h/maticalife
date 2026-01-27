// src/pages/Addresses.tsx
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import AuthModal from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

type AddressRow = {
    id: number;
    user_id: string;
    label?: string | null;
    full_name?: string | null;
    phone?: string | null;
    line1?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
    is_default?: boolean | null;
    is_active?: boolean | null;
};

const ADDRESS_LABELS = ['Home', 'Work', 'Other'] as const;

const emptyForm = {
    label: 'Home',
    full_name: '',
    phone: '',
    line1: '',
    city: '',
    state: '',
    postal_code: '',
};

const Addresses: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [addresses, setAddresses] = useState<AddressRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<AddressRow | null>(null);
    const [form, setForm] = useState(emptyForm);

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);

    // ---------------- Fetch addresses ----------------

    const loadAddresses = async () => {
        if (!user?.id) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('is_default', { ascending: false });

        if (error) {
            toast({ title: 'Failed to load addresses', description: error.message });
        } else {
            setAddresses(data || []);
        }

        setLoading(false);
    };

    // redirect if logged out
    useEffect(() => {
        if (isAuthenticated === false) navigate('/');
    }, [isAuthenticated, navigate]);

    // load addresses when authenticated
    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;
        loadAddresses();
    }, [isAuthenticated, user?.id]);

    // ---------------- Save address ----------------

    const handleSave = async () => {
        if (!user?.id) return;

        if (!form.line1 || !form.city || !form.state || !form.postal_code) {
            toast({
                title: 'Missing fields',
                description: 'Please fill all required fields.',
            });
            return;
        }

        if (form.phone && !/^\+?\d{6,15}$/.test(form.phone.replace(/\s/g, ''))) {
            toast({ title: 'Invalid phone', description: 'Enter a valid phone number.' });
            return;
        }

        if (!/^\d{6}$/.test(form.postal_code)) {
            toast({ title: 'Invalid PIN code', description: 'PIN code must be 6 digits.' });
            return;
        }

        const basePayload = {
            user_id: user.id,
            label: form.label,
            full_name: form.full_name,
            phone: form.phone,
            line1: form.line1,
            city: form.city,
            state: form.state,
            postal_code: form.postal_code,
            country: 'India',
        };

        let error;

        if (editing) {
            ({ error } = await supabase
                .from('addresses')
                .update(basePayload)
                .eq('id', editing.id));
        } else {
            ({ error } = await supabase
                .from('addresses')
                .insert({
                    ...basePayload,
                    is_default: addresses.length === 0,
                }));
        }

        if (error) {
            toast({ title: 'Save failed', description: error.message });
            return;
        }

        toast({ title: 'Address saved' });
        setForm(emptyForm);
        setEditing(null);
        loadAddresses();
    };

    // ---------------- Delete ----------------

    const handleDelete = async (addr: AddressRow) => {
        if (addresses.length === 1) {
            toast({ title: 'Cannot delete', description: 'At least one address is required.' });
            return;
        }

        if (addr.is_default) {
            toast({
                title: 'Cannot delete default',
                description: 'Set another address as default first.',
            });
            return;
        }

        const { error } = await supabase
            .from('addresses')
            .update({ is_active: false })
            .eq('id', addr.id);

        if (error) {
            toast({ title: 'Delete failed', description: error.message });
            return;
        }

        toast({ title: 'Address deleted' });
        loadAddresses();
    };

    // ---------------- Set default ----------------

    const makeDefault = async (id: number) => {
        const { error } = await supabase.rpc('set_default_address', {
            p_user_id: user!.id,
            p_address_id: id,
        });

        if (error) {
            toast({ title: 'Failed to set default', description: error.message });
            return;
        }

        toast({ title: 'Default address updated' });
        loadAddresses();
    };

    // ---------------- UI ----------------

    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>My Addresses | Matica.life</title>
            </Helmet>

            <Header onOpenCart={() => setIsCartOpen(true)} onOpenAuth={() => setIsAuthOpen(true)} />

            <main className="pt-24 pb-16 container mx-auto px-4 max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">My Addresses</h1>
                    <Button
                        onClick={() => {
                            setEditing(null);
                            setForm(emptyForm);
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Address
                    </Button>
                </div>

                {/* Address list */}
                <div className="space-y-4 mb-10">
                    {loading ? (
                        <p className="text-muted-foreground">Loading…</p>
                    ) : addresses.length === 0 ? (
                        <p className="text-muted-foreground">No addresses saved yet.</p>
                    ) : (
                        addresses.map((addr) => (
                            <Card key={addr.id} className="border-border/50">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium">{addr.label}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {addr.line1}, {addr.city}, {addr.state} – {addr.postal_code}
                                            </p>
                                            {addr.is_default && <Badge className="mt-2">Default</Badge>}
                                        </div>

                                        <div className="flex gap-2">
                                            {!addr.is_default && (
                                                <Button size="sm" variant="outline" onClick={() => makeDefault(addr.id)}>
                                                    <Check className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setEditing(addr);
                                                    setForm({
                                                        label: addr.label || 'Home',
                                                        full_name: addr.full_name || '',
                                                        phone: addr.phone || '',
                                                        line1: addr.line1 || '',
                                                        city: addr.city || '',
                                                        state: addr.state || '',
                                                        postal_code: addr.postal_code || '',
                                                    });
                                                }}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleDelete(addr)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>{editing ? 'Edit Address' : 'Add Address'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Label</Label>
                            <select
                                className="w-full rounded-md border px-3 py-2"
                                value={form.label}
                                onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))}
                            >
                                {ADDRESS_LABELS.map((l) => (
                                    <option key={l} value={l}>
                                        {l}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {(['full_name', 'phone', 'line1', 'city', 'state', 'postal_code'] as const).map(
                            (field) => (
                                <div key={field}>
                                    <Label>{field.replace('_', ' ').toUpperCase()}</Label>
                                    <Input
                                        value={(form as any)[field]}
                                        onChange={(e) => setForm((s) => ({ ...s, [field]: e.target.value }))}
                                    />
                                </div>
                            ),
                        )}

                        <div className="flex gap-2">
                            <Button onClick={handleSave}>Save</Button>
                            {editing && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setEditing(null);
                                        setForm(emptyForm);
                                    }}
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>

            <Footer />
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        </div>
    );
};

export default Addresses;
