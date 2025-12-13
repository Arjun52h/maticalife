// // src/hooks/useWishlist.ts
// import { useCallback, useEffect, useState, useRef } from 'react';
// import { supabase } from '@/lib/supabaseClient';
// import { useAuth } from '@/context/AuthContext';

// type WishlistRow = {
//     id: number;
//     user_id: string;
//     product_id: number;
//     created_at: string;
// };

// export function useWishlist() {
//     const { user } = useAuth();
//     const [ids, setIds] = useState<number[] | null>(null);
//     const [loading, setLoading] = useState(false);
//     const [mutating, setMutating] = useState(false);
//     const channelRef = useRef<any | null>(null);

//     const fetch = useCallback(async () => {
//         if (!user) {
//             setIds([]);
//             return;
//         }
//         setLoading(true);
//         try {
//             const res = await supabase
//                 .from('wishlist_items')
//                 .select('product_id')
//                 .eq('user_id', user.id);

//             // supabase returns { data, error }
//             const anyRes = res as any;
//             if (anyRes.error) {
//                 console.error('useWishlist fetch DB error:', anyRes.error);
//                 setIds([]);
//                 return;
//             }
//             const data = anyRes.data as Array<{ product_id: number }>;
//             setIds((data ?? []).map(r => Number(r.product_id)));
//         } catch (err) {
//             console.error('useWishlist fetch exception:', err);
//             setIds([]);
//         } finally {
//             setLoading(false);
//         }
//     }, [user]);

//     useEffect(() => {
//         // initial fetch
//         fetch();

//         // realtime subscription only for logged-in user
//         if (!user) return;

//         const channel = supabase
//             .channel(`public:wishlist_items:user=${user.id}`)
//             .on(
//                 'postgres_changes',
//                 { event: '*', schema: 'public', table: 'wishlist_items', filter: `user_id=eq.${user.id}` },
//                 (payload) => {
//                     console.debug('wishlist realtime payload', payload);
//                     fetch();
//                 }
//             );

//         // subscribe
//         channel.subscribe((status) => {
//             console.debug('wishlist channel status', status);
//         });

//         channelRef.current = channel;

//         return () => {
//             try {
//                 if (channelRef.current) {
//                     supabase.removeChannel(channelRef.current);
//                     channelRef.current = null;
//                 }
//             } catch (e) {
//                 console.debug('Error removing wishlist channel', e);
//             }
//         };
//     }, [user, fetch]);

//     const add = useCallback(async (productId: number) => {
//         if (!user) {
//             const e = new Error('UNAUTH');
//             console.warn('useWishlist add attempted while unauthenticated');
//             throw e;
//         }
//         setMutating(true);
//         const pid = Number(productId);

//         // optimistic update
//         setIds(prev => Array.from(new Set([...(prev ?? []), pid])));

//         try {
//             const res = await supabase
//                 .from('wishlist_items')
//                 .insert({ user_id: user.id, product_id: pid });

//             const anyRes = res as any;
//             if (anyRes.error) {
//                 console.error('useWishlist add DB error:', anyRes.error);
//                 // rollback optimistic
//                 setIds(prev => (prev ? prev.filter(id => id !== pid) : []));
//                 throw anyRes.error;
//             }

//             return true;
//         } catch (err) {
//             console.error('useWishlist add exception:', err);
//             setIds(prev => (prev ? prev.filter(id => id !== pid) : []));
//             throw err;
//         } finally {
//             setMutating(false);
//         }
//     }, [user]);

//     const remove = useCallback(async (productId: number) => {
//         if (!user) {
//             const e = new Error('UNAUTH');
//             console.warn('useWishlist remove attempted while unauthenticated');
//             throw e;
//         }
//         setMutating(true);
//         const pid = Number(productId);

//         // optimistic remove
//         setIds(prev => (prev ? prev.filter(id => id !== pid) : []));

//         try {
//             const res = await supabase
//                 .from('wishlist_items')
//                 .delete()
//                 .match({ user_id: user.id, product_id: pid });

//             const anyRes = res as any;
//             if (anyRes.error) {
//                 console.error('useWishlist remove DB error:', anyRes.error);
//                 // rollback
//                 setIds(prev => Array.from(new Set([...(prev ?? []), pid])));
//                 throw anyRes.error;
//             }

//             return true;
//         } catch (err) {
//             console.error('useWishlist remove exception:', err);
//             setIds(prev => Array.from(new Set([...(prev ?? []), pid])));
//             throw err;
//         } finally {
//             setMutating(false);
//         }
//     }, [user]);

//     const toggle = useCallback(async (productId: number) => {
//         if (ids === null) await fetch();
//         const pid = Number(productId);
//         const exists = (ids ?? []).includes(pid);
//         if (exists) return remove(pid);
//         return add(pid);
//     }, [ids, add, remove, fetch]);

//     return {
//         productIds: ids ?? [],
//         loading,
//         mutating,
//         isInWishlist: (productId: number) => (ids ?? []).includes(Number(productId)),
//         fetch,
//         add,
//         remove,
//         toggle,
//     };
// }
