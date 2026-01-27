// src/pages/Wishlist.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, Sparkles, Package } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import WishlistButton from '@/components/wishlist/WishlistButton';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import AuthModal from '@/components/AuthModal';
import { cn } from '@/lib/utils';

type Prod = {
  id: number;
  name: string;
  category?: string;
  subtitle?: string;
  price: number;
  originalPrice?: number;
  image: string;
  in_stock: boolean;
  rating?: number;
  reviews?: number;
  new?: boolean;
};

// const formatCurrency = (raw: number) => {
//   // keep parity with other pages (raw in paise/cents)
//   const rupees = raw / 100;
//   return rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// };

const formatCurrency = (raw: number) => {
  return raw.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const Wishlist: React.FC = () => {
  const { productIds, fetch, remove, add, toggle } = useWishlist();
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Prod[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // derived totals
  const totalItems = productIds.length;

  // fetch product details whenever productIds change
  useEffect(() => {
    let mounted = true;
    if (!user) {
      setProducts([]);
      return;
    }

    // inside your useEffect where you fetch product details
    // inside useEffect: replace the existing fetchProducts with this
    const fetchProducts = async () => {
      if (!productIds || productIds.length === 0) {
        if (mounted) setProducts([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, subtitle, price, original_price, image, in_stock, rating, reviews')
          .in('id', productIds);

        if (error) {
          console.error('Wishlist: fetch products error', error);
          if (mounted) setProducts([]);
          return;
        }

        const normalized = (data ?? []).map((d: any) => ({
          id: d.id,
          name: d.name,
          subtitle: d.subtitle ?? undefined,
          price: d.price,
          originalPrice: d.original_price ?? d.originalPrice ?? undefined,
          image: d.image,
          in_stock: d.in_stock ?? d.inStock ?? true,
          rating: d.rating ?? 0,
          reviews: d.reviews ?? 0,
        })) as Prod[];

        // map for O(1) lookups and preserve productIds (context order, newest-first)
        const productsById = new Map<number, Prod>(normalized.map(p => [p.id, p]));
        const ordered = (productIds ?? []).map(id => productsById.get(id)).filter(Boolean) as Prod[];

        if (mounted) {
          setProducts(ordered);
        }
      } catch (err) {
        console.error('Wishlist: fetch products exception', err);
        if (mounted) setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      mounted = false;
    };
  }, [productIds, user]);

  // actions
  const handleAddToCart = (product: Prod) => {
    addToCart(product as any);
  };

  const handleMoveAllToCart = () => {
    products.forEach((p) => addToCart(p as any));
    // clear wishlist by removing every id
    (productIds ?? []).forEach((id) => remove(id));
  };

  const handleClearAll = () => {
    (productIds ?? []).forEach((id) => remove(id));
  };

  const handleRemove = (id: number) => {
    remove(id);
    // optimistic local filter (useful if realtime hasn't arrived)
    setProducts((prev) => prev.filter((x) => x.id !== id));
  };

  const anyOutOfStock = useMemo(() => products.some((p) => !p.in_stock), [products]);

  return (
    <>
      <Helmet>
        <title>My Wishlist</title>
        <meta name="description" content="Your saved items — manage your wishlist, move to cart or continue shopping." />
      </Helmet>

      <Header onOpenCart={() => setIsCartOpen(true)} onOpenAuth={() => setIsAuthOpen(true)} />

      <main className="min-h-screen pt-24 pb-16">
        {/* Hero */}
        <section className="relative py-12 md:py-16 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-primary/10 backdrop-blur-sm">
                    <ShoppingBag className="w-7 h-7 text-primary" />
                  </div>
                  <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'} saved
                  </span>
                </div>

                <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
                  My <span className="text-primary">Wishlist</span>
                </h1>

                <p className="text-muted-foreground text-lg max-w-md">
                  Your curated collection — save items you love, move them to cart, or keep them for later.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={handleMoveAllToCart} className="btn-primary gap-2" disabled={products.length === 0}>
                  <ShoppingBag className="w-4 h-4" />
                  Add All to Cart
                </Button>

                <Button
                  variant="outline"
                  onClick={handleClearAll}
                  className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground gap-2"
                  disabled={products.length === 0}
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            {(!isAuthenticated || productIds.length === 0) && !loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="relative mb-8">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/6 flex items-center justify-center animate-pulse">
                    <ShoppingBag className="w-12 h-12 text-primary/60" />
                  </div>
                </div>

                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Your wishlist is empty
                </h2>
                <p className="text-muted-foreground text-lg max-w-md mb-8">
                  Start saving items you love and find them here for easy access.
                </p>

                <div className="flex gap-3 justify-center">
                  <Button onClick={() => navigate('/')} className="btn-primary gap-2">Browse products</Button>
                </div>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-2xl bg-background/30 h-44 p-4" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, idx) => (
                  <article
                    key={product.id}
                    className={cn(
                      'group relative bg-gradient-to-b from-white/4 to-white/2 backdrop-blur-md border border-white/6 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300',
                    )}
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-muted/30">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />

                      {/* Quick actions (remove) */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(product.id);
                          }}
                          className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm shadow-md flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 hover:scale-110"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                            -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                          </span>
                        )}
                        {product.new && (
                          <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                            NEW
                          </span>
                        )}
                      </div>

                      {/* Stock badge */}
                      <div className="absolute bottom-4 left-4 z-20">
                        <span
                          className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 backdrop-blur-sm',
                            product.in_stock
                              ? 'bg-green-500/20 text-green-700 border border-green-500/30'
                              : 'bg-red-500/20 text-red-700 border border-red-500/30'
                          )}
                        >
                          <Package className="w-3 h-3" />
                          {product.in_stock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-4">
                      <div>
                        <span className="text-xs font-medium text-primary uppercase tracking-wider">
                          {product.category ?? ''}
                        </span>

                        <h3 className="font-display text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors mt-1">
                          {product.name}
                        </h3>

                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <svg
                                key={i}
                                className={cn('w-4 h-4', i < Math.floor(product.rating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground')}
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">({product.reviews ?? 0})</span>
                        </div>

                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-2xl font-bold text-primary">
                            ₹{formatCurrency(product.price)}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                              ₹{Number(product.originalPrice).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={() => {
                            handleAddToCart(product);
                          }}
                          disabled={!product.in_stock}
                          className="flex-1 btn-primary gap-2"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          Add to Cart
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => navigate(`/product/${product.id}`)}
                          className="border-primary/30 hover:bg-primary/10"
                        >
                          View
                        </Button>

                        <div className="w-12 flex items-center justify-center">
                          {/* Wishlist toggle (circular) */}
                          <div
                            className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm shadow-md flex items-center justify-center transition-transform duration-300 hover:scale-110"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <WishlistButton
                              productId={product.id}
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="p-0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* subtle bottom gradient */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white/6 to-transparent" />
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};

export default Wishlist;
