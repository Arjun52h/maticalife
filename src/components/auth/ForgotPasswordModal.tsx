import React, { useState, useEffect } from 'react';
import { X, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialEmail?: string;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, initialEmail = '' }) => {
    const [email, setEmail] = useState(initialEmail);
    const [submitting, setSubmitting] = useState(false);
    const { sendPasswordReset } = useAuth();

    useEffect(() => {
        setEmail(initialEmail);
    }, [initialEmail]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!email) return;
        setSubmitting(true);
        try {
            const ok = await sendPasswordReset(email);
            if (ok) {
                onClose();
                setEmail('');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;
    return (
        <div
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-background rounded-2xl shadow-strong overflow-hidden animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="relative p-6 pb-4 bg-gradient-to-br from-primary/10 to-accent/10">
                    <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>

                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                        <span className="font-display text-3xl font-bold text-primary">M</span>
                    </div>

                    <h2 className="font-display text-2xl font-semibold text-foreground">Reset Password</h2>
                    <p className="text-muted-foreground mt-1">Enter your email and we’ll send reset instructions.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fp-email" className="text-sm font-medium">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="fp-email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="pl-10 h-12 bg-muted/50 border-border focus:bg-background transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                        <Button type="submit" className="h-11" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                'Send Reset Email'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPasswordModal;
