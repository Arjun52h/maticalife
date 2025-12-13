// src/context/CartContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Product } from '@/types';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

/**
 * CartItem uses numeric productId to match your DB (product_id bigint).
 */
export type CartItem = {
  productId: number;
  title?: string;
  price: number;
  imageUrl?: string;
  quantity: number;
};

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  loading: boolean;
  refreshServerCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LS_KEY = 'matica:cart:v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  // keep refs for timers & subscription
  const saveTimer = useRef<number | null>(null);
  const channelRef = useRef<any | null>(null);

  // helpers: persist local
  const persistLocal = useCallback((next: CartItem[]) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch (e) {
      // ignore
      console.debug('persistLocal failed', e);
    }
  }, []);

  const cartIdRef = useRef<string | null>(null);


  // DB helpers matching your schema ----------------------------------------

  // get or create carts row for user -> returns cart id (uuid) or null
  const getOrCreateCartId = useCallback(async (uid: string): Promise<string | null> => {
    try {
      // try cached first
      if (cartIdRef.current) return cartIdRef.current;

      // try to find existing cart
      const { data: existing, error: getErr } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', uid)
        .limit(1)
        .maybeSingle();

      if (getErr) {
        console.error('getOrCreateCartId - select error', getErr);
      }

      if (existing?.id) {
        cartIdRef.current = existing.id as string;
        return cartIdRef.current;
      }

      // create
      const { data: inserted, error: insertErr } = await supabase
        .from('carts')
        .insert({ user_id: uid })
        .select('id')
        .maybeSingle();

      if (insertErr) {
        console.error('getOrCreateCartId - insert error', insertErr);
        return null;
      }

      cartIdRef.current = inserted?.id ?? null;
      return cartIdRef.current;
    } catch (err) {
      console.error('getOrCreateCartId exception', err);
      return null;
    }
  }, []);

  // load cart_items for cartId
  // load cart_items for cartId — improved to fetch product metadata
  const loadCartItemsForCart = useCallback(async (cartId: string | null): Promise<CartItem[]> => {
    if (!cartId) return [];
    try {
      const { data: cartRows, error: cartErr } = await supabase
        .from('cart_items')
        .select('product_id, quantity')
        .eq('cart_id', cartId);

      if (cartErr) {
        console.error('loadCartItemsForCart - cart_items select error', cartErr);
        return [];
      }

      const rows = (cartRows ?? []) as Array<{ product_id: number; quantity: number }>;
      if (!rows.length) return [];

      const productIds = Array.from(new Set(rows.map(r => Number(r.product_id)).filter(Boolean)));

      // fetch product metadata for those ids
      const { data: productsData, error: prodErr } = await supabase
        .from('products')
        .select('id, name, price, image')
        .in('id', productIds);

      if (prodErr) {
        console.error('loadCartItemsForCart - products select error', prodErr);
        // fallback: return items without metadata (but better to return nothing)
        return rows.map(r => ({
          productId: Number(r.product_id),
          quantity: Number(r.quantity),
          price: 0,
        } as CartItem));
      }

      // remove orphan cart_items referencing deleted products
      const foundIds = new Set((productsData ?? []).map((p: any) => Number(p.id)));
      const orphanIds = productIds.filter(pid => !foundIds.has(pid));
      if (orphanIds.length) {
        const { error: orphanDelErr } = await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cartId)
          .in('product_id', orphanIds);

        if (orphanDelErr) {
          console.debug('Failed to delete orphan cart_items', orphanDelErr);
        }
      }

      const productsById = new Map<number, { id: number; name?: string; price?: number; image?: string }>();
      (productsData ?? []).forEach((p: any) => {
        productsById.set(Number(p.id), { id: Number(p.id), name: p.name, price: Number(p.price ?? 0), image: p.image });
      });

      // merge: only include items where product exists (avoid ghost items)
      const normalized: CartItem[] = rows
        .map(r => {
          const pid = Number(r.product_id);
          const prod = productsById.get(pid);
          if (!prod) return null; // product deleted — drop it
          return {
            productId: pid,
            quantity: Number(r.quantity),
            price: prod.price ?? 0,
            title: prod.name ?? '',
            imageUrl: prod.image ?? '',
          } as CartItem;
        })
        .filter(Boolean) as CartItem[];

      return normalized;
    } catch (err) {
      console.error('loadCartItemsForCart exception', err);
      return [];
    }
  }, []);


  // persist cart items server-side by replacing cart_items for cart_id
  // strategy: delete existing rows for cart_id then bulk insert current ones
  const saveCartItemsForCart = useCallback(async (cartId: string | null, nextItems: CartItem[]) => {
    if (!cartId) return;
    try {
      // delete existing
      const { error: delErr } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

      if (delErr) {
        console.error('saveCartItemsForCart delete error', delErr);
        // continue - attempt insert anyway
      }

      if (!nextItems || nextItems.length === 0) {
        return;
      }

      const payloadWithUnitPrice = nextItems.map(i => ({
        cart_id: cartId,
        product_id: Number(i.productId),
        quantity: Number(i.quantity),
        unit_price: Number(i.price || 0), // optional column
      }));

      // Attempt insert with unit_price first (if your DB has it). If it fails with
      // a "column does not exist" style error, retry without unit_price.
      let res = await supabase.from('cart_items').insert(payloadWithUnitPrice);
      const anyRes = res as any;

      if (anyRes?.error) {
        const errMessage = String(anyRes.error?.message || anyRes.error);
        // detect Postgrest "column does not exist" / cannot insert into unknown column errors (defensive)
        const unitPriceColumnError = /column .*unit_price.* does not exist|invalid column name|unknown column/i.test(errMessage);

        if (unitPriceColumnError) {
          console.debug('saveCartItemsForCart: unit_price column missing on server, retrying insert without it.');
          // retry without unit_price
          const payload = nextItems.map(i => ({
            cart_id: cartId,
            product_id: Number(i.productId),
            quantity: Number(i.quantity),
          }));
          const retry = await supabase.from('cart_items').insert(payload);
          const retryAny = retry as any;
          if (retryAny?.error) {
            console.error('saveCartItemsForCart insert (no unit_price) error', retryAny.error);
          }
        } else {
          console.error('saveCartItemsForCart insert error', anyRes.error);
        }
      }
    } catch (err: any) {
      // In case supabase SDK throws instead of returning error object
      const msg = err?.message ?? String(err);
      // if the error text suggests missing unit_price, retry without it
      if (/unit_price/i.test(msg)) {
        try {
          const payload = nextItems.map(i => ({
            cart_id: cartId,
            product_id: Number(i.productId),
            quantity: Number(i.quantity),
          }));
          const retry = await supabase.from('cart_items').insert(payload);
          const retryAny = retry as any;
          if (retryAny?.error) {
            console.error('saveCartItemsForCart insert (retry) error', retryAny.error);
          }
        } catch (e) {
          console.error('saveCartItemsForCart retry exception', e);
        }
      } else {
        console.error('saveCartItemsForCart exception', err);
      }
    }
  }, []);

  // subscribe to changes on cart_items for cartId
  const subscribeCartItems = useCallback((cartId: string | null) => {
    // cleanup old
    try {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    } catch (e) {
      // ignore
    }

    if (!cartId) return;

    const channel = supabase
      .channel(`public:cart_items:cart=${cartId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cart_items', filter: `cart_id=eq.${cartId}` },
        (payload: any) => {
          // payload.record for insert/update, payload.old for delete
          // whenever change occurs, re-load the cart_items and set local state
          (async () => {
            const serverItems = await loadCartItemsForCart(cartId);
            // merge server quantities with current local metadata (price/title) where available
            setItems(prev => {
              // map local metadata by productId
              const meta = new Map<number, Partial<CartItem>>();
              (prev ?? []).forEach(p => {
                meta.set(p.productId, { title: p.title, price: p.price, imageUrl: p.imageUrl });
              });
              const normalized = serverItems.map(si => ({
                productId: si.productId,
                quantity: si.quantity,
                price: meta.get(si.productId)?.price ?? si.price ?? 0,
                title: meta.get(si.productId)?.title,
                imageUrl: meta.get(si.productId)?.imageUrl,
              } as CartItem));
              persistLocal(normalized);
              return normalized;
            });
          })();
        }
      );

    channel.subscribe();
    channelRef.current = channel;
  }, [loadCartItemsForCart, persistLocal]);

  // merge local + server: add quantities for same productId (server considered authoritative but we add)
  const mergeServerAndLocal = useCallback((server: CartItem[], local: CartItem[]) => {
    // Map server items first (server is authoritative for quantity)
    const map = new Map<number, CartItem>();
    (server ?? []).forEach(s => {
      map.set(s.productId, { ...s });
    });

    // Add any local-only items; do NOT sum quantities for items that already exist on server
    (local ?? []).forEach(l => {
      const key = l.productId;
      const existing = map.get(key);
      if (existing) {
        // preserve server quantity, but keep any local metadata if server lacks it
        existing.price = existing.price || l.price || 0;
        existing.title = existing.title || l.title;
        existing.imageUrl = existing.imageUrl || l.imageUrl;
      } else {
        map.set(key, { ...l });
      }
    });

    return Array.from(map.values());
  }, []);


  // high-level sync on auth change
  useEffect(() => {
    let mounted = true;

    const sync = async () => {
      setLoading(true);
      try {
        const uid = user?.id ?? null;
        // guest: no server sync, keep local
        if (!uid) {
          try {
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current);
              channelRef.current = null;
            }
          } catch (e) { /* ignore */ }
          setLoading(false);
          return;
        }

        // have user: get or create cart row, load server items
        const cartId = await getOrCreateCartId(uid);
        if (!cartId) {
          console.warn('[CartProvider] no cart id for user', uid);
          setLoading(false);
          return;
        }

        const serverItems = await loadCartItemsForCart(cartId);

        // local guest items
        const raw = localStorage.getItem(LS_KEY);
        const localItems = raw ? (JSON.parse(raw) as CartItem[]) : [];

        const merged = mergeServerAndLocal(serverItems ?? [], localItems ?? []);

        if (!mounted) return;

        setItems(merged);
        persistLocal(merged);

        // persist merged to server
        await saveCartItemsForCart(cartId, merged);

        // subscribe to server changes
        subscribeCartItems(cartId);
      } catch (err) {
        console.error('CartProvider sync failed', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    sync();

    return () => {
      mounted = false;
    };
  }, [
    user,
    getOrCreateCartId,
    loadCartItemsForCart,
    mergeServerAndLocal,
    persistLocal,
    saveCartItemsForCart,
    subscribeCartItems,
  ]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      try {
        if (channelRef.current) supabase.removeChannel(channelRef.current);
      } catch (e) { /* ignore */ }
    };
  }, []);

  // schedule server save (debounced) for user's cart
  const scheduleServerSave = useCallback(async (nextItems: CartItem[]) => {
    // always persist local immediately
    persistLocal(nextItems);

    // only save to server if logged in and cart exists
    const uid = user?.id ?? null;
    if (!uid) return;

    // get cart id (should exist)
    const cartId = await getOrCreateCartId(uid);
    if (!cartId) return;

    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    saveTimer.current = window.setTimeout(async () => {
      await saveCartItemsForCart(cartId, nextItems);
      saveTimer.current = null;
    }, 700) as unknown as number;
  }, [user, getOrCreateCartId, persistLocal, saveCartItemsForCart]);

  // operations -------------------------------------------------------------

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    // expect product.id to be numeric
    const pid = Number((product as any).id);
    if (!pid || Number.isNaN(pid)) {
      console.warn('addToCart: product missing numeric id', product);
      return;
    }

    setItems(prev => {
      const next = [...(prev ?? [])];
      const existing = next.find(it => it.productId === pid);
      if (existing) {
        existing.quantity = Math.min(999, (existing.quantity || 0) + quantity);
        toast({
          title: 'Cart Updated',
          description: `${(product as any).name ?? 'Item'} quantity is now ${existing.quantity}`,
        });
      } else {
        const newItem: CartItem = {
          productId: pid,
          title: (product as any).name ?? '',
          price: (product as any).price ?? 0,
          imageUrl: (product as any).image ?? '',
          quantity,
        };
        // put newest first
        next.unshift(newItem);
        toast({
          title: 'Added to Cart',
          description: `${newItem.title || 'Product'} added`,
        });
      }

      // schedule server save
      scheduleServerSave(next);
      return next;
    });
  }, [scheduleServerSave]);

  const removeFromCart = useCallback((productId: number) => {
    setItems(prev => {
      const next = (prev ?? []).filter(it => it.productId !== productId);
      scheduleServerSave(next);
      return next;
    });
  }, [scheduleServerSave]);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setItems(prev => {
      const next = (prev ?? []).map(it => it.productId === productId ? { ...it, quantity } : it);
      scheduleServerSave(next);
      return next;
    });
  }, [removeFromCart, scheduleServerSave]);

  const clearCart = useCallback(() => {
    setItems([]);
    persistLocal([]);
    const uid = user?.id ?? null;
    (async () => {
      if (!uid) return;
      const cartId = await getOrCreateCartId(uid);
      if (cartId) {
        await saveCartItemsForCart(cartId, []);
      }
    })();
    toast({ title: 'Cart cleared', description: 'All items removed' });
  }, [persistLocal, saveCartItemsForCart, getOrCreateCartId, user]);

  const refreshServerCart = useCallback(async () => {
    const uid = user?.id ?? null;
    if (!uid) return;
    const cartId = await getOrCreateCartId(uid);
    if (!cartId) return;
    const serverItems = await loadCartItemsForCart(cartId);
    const raw = localStorage.getItem(LS_KEY);
    const localItems = raw ? (JSON.parse(raw) as CartItem[]) : [];
    const merged = mergeServerAndLocal(serverItems ?? [], localItems ?? []);
    setItems(merged);
    persistLocal(merged);
  }, [user, getOrCreateCartId, loadCartItemsForCart, mergeServerAndLocal, persistLocal]);

  // derived totals
  const totalItems = items.reduce((s, it) => s + (it.quantity || 0), 0);
  const totalPrice = items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 0), 0);

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    loading,
    refreshServerCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};

export default CartProvider;
