// src/context/WishlistContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

type WishlistContextValue = {
    productIds: number[];
    loading: boolean;
    mutating: boolean;
    isInWishlist: (productId: number) => boolean;
    fetch: () => Promise<void>;
    add: (productId: number) => Promise<boolean>;
    remove: (productId: number) => Promise<boolean>;
    toggle: (productId: number) => Promise<boolean>;
};

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [ids, setIds] = useState<number[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [mutating, setMutating] = useState(false);
    const channelRef = useRef<any | null>(null);

    const fetch = useCallback(async () => {
        if (!user) {
            setIds([]);
            return;
        }
        setLoading(true);
        try {
            // get wishlist items newest first
            const res = await supabase
                .from('wishlist_items')
                .select('product_id, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false }); // newest first

            const anyRes = res as any;
            if (anyRes.error) {
                console.error('Wishlist fetch DB error:', anyRes.error);
                setIds([]);
                return;
            }
            const data = (anyRes.data ?? []) as Array<{ product_id: number; created_at: string }>;
            setIds(data.map(r => Number(r.product_id)));

        } catch (err) {
            console.error('Wishlist fetch exception:', err);
            setIds([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        // initial fetch whenever user changes
        fetch();

        // subscribe to realtime changes for this user
        if (!user) return;

        const channel = supabase
            .channel(`public:wishlist_items:user=${user.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'wishlist_items', filter: `user_id=eq.${user.id}` },
                (payload) => {
                    // On any change, re-fetch to keep state in sync
                    fetch();
                }
            );

        channel.subscribe((status) => {
            // console.debug('wishlist channel status', status);
        });

        channelRef.current = channel;

        return () => {
            try {
                if (channelRef.current) {
                    supabase.removeChannel(channelRef.current);
                    channelRef.current = null;
                }
            } catch (e) {
                // ignore cleanup errors
            }
        };
    }, [user, fetch]);

    const add = useCallback(async (productId: number) => {
        if (!user) {
            const e = new Error('UNAUTH');
            console.warn('useWishlist add attempted while unauthenticated');
            throw e;
        }
        setMutating(true);
        const pid = Number(productId);

        // optimistic update
        setIds(prev => {
            const next = [pid, ...(prev ?? [])];
            // ensure uniqueness (remove duplicates that might exist later)
            return Array.from(new Set(next));
        });


        try {
            const res = await supabase.from('wishlist_items').insert({ user_id: user.id, product_id: pid });
            const anyRes = res as any;
            if (anyRes.error) {
                console.error('useWishlist add DB error:', anyRes.error);
                setIds(prev => (prev ? prev.filter(id => id !== pid) : []));
                throw anyRes.error;
            }
            return true;
        } catch (err) {
            console.error('useWishlist add exception:', err);
            setIds(prev => (prev ? prev.filter(id => id !== pid) : []));
            throw err;
        } finally {
            setMutating(false);
        }
    }, [user]);

    const remove = useCallback(async (productId: number) => {
        if (!user) {
            const e = new Error('UNAUTH');
            console.warn('useWishlist remove attempted while unauthenticated');
            throw e;
        }
        setMutating(true);
        const pid = Number(productId);

        // optimistic remove
        setIds(prev => (prev ? prev.filter(id => id !== pid) : []));

        try {
            const res = await supabase.from('wishlist_items').delete().match({ user_id: user.id, product_id: pid });
            const anyRes = res as any;
            if (anyRes.error) {
                console.error('useWishlist remove DB error:', anyRes.error);
                setIds(prev => {
                    const next = [pid, ...(prev ?? [])];
                    return Array.from(new Set(next));
                });
                throw anyRes.error;
            }
            return true;
        } catch (err) {
            console.error('useWishlist remove exception:', err);
            setIds(prev => {
                const next = [pid, ...(prev ?? [])];
                return Array.from(new Set(next));
            });

            throw err;
        } finally {
            setMutating(false);
        }
    }, [user]);

    const toggle = useCallback(async (productId: number) => {
        if (ids === null) await fetch();
        const pid = Number(productId);
        const exists = (ids ?? []).includes(pid);
        if (exists) return remove(pid);
        return add(pid);
    }, [ids, add, remove, fetch]);

    const value: WishlistContextValue = {
        productIds: ids ?? [],
        loading,
        mutating,
        isInWishlist: (productId: number) => (ids ?? []).includes(Number(productId)),
        fetch,
        add,
        remove,
        toggle,
    };

    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlistContext = () => {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error('useWishlistContext must be used within a WishlistProvider');
    return ctx;
};

// For compatibility: export a function named useWishlist (so existing imports keep working)
// It simply proxies to useWishlistContext.
export const useWishlist = useWishlistContext;
export default WishlistProvider;
