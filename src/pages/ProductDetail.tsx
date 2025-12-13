import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Star,
  Heart,
  Truck,
  ShieldCheck,
  Package,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import AuthModal from "@/components/AuthModal";
import ProductCard from "@/components/ProductCard";

import { useCart } from "@/context/CartContext";
import { useProduct, useProducts } from "@/hooks/useProducts";
import WishlistButton from '@/components/wishlist/WishlistButton';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from '@/hooks/use-toast';


const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useProduct(id);
  // --- IMAGE GALLERY STATE ---
  const galleryImages = product?.images?.length
    ? product.images
    : [product?.image ?? ""];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = galleryImages[selectedIndex];

  const nextImage = () => {
    setSelectedIndex((i) => (i + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setSelectedIndex((i) =>
      i === 0 ? galleryImages.length - 1 : i - 1
    );
  };

  const { data: allProducts } = useProducts();

  const relatedProducts = useMemo(
    () =>
      product && allProducts
        ? allProducts
          .filter(
            (p) =>
              p.id !== product.id &&
              p.category?.id === product.category?.id
          )
          .slice(0, 4)
        : [],
    [product, allProducts]
  );


  if (isLoading) {
    return (
      <section className="min-h-screen bg-lightbg text-darktext flex items-center justify-center px-4">
        <p className="text-sm text-darktext/70">Loading product…</p>
      </section>
    );
  }

  // 404-style state but still inside full layout
  if (!product) {
    return (
      <>
        <Helmet>
          <title>Product Not Found | Matica.life</title>
        </Helmet>

        <div className="min-h-screen bg-background">
          <Header
            onOpenCart={() => setIsCartOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
          />

          <main className="pt-24 pb-16">
            <div className="container mx-auto px-4 text-center">
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-3">
                Oops
              </p>
              <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4">
                We couldn’t find that piece.
              </h1>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                It might have sold out or moved to a different shelf. Browse our
                current collection instead.
              </p>
              <Link to="/shop">
                <Button className="btn-primary px-6">
                  Back to Shop
                </Button>
              </Link>
            </div>
          </main>

          <Footer />

          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
          />
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
          />
        </div>
      </>
    );
  }


  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // canonical product URL
    const url = `${window.location.origin}/product/${product.id}`;

    // Try native Web Share API first (mobile / supported browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description ?? product.name,
          url,
        });
        toast({ title: 'Shared', description: 'Product shared successfully.' });
        return;
      } catch (err: any) {
        // user cancelled or share failed — fall through to clipboard fallback
        console.debug('Web Share failed or cancelled', err?.message || err);
      }
    }

    // Fallback: copy to clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Link copied', description: 'Product URL copied to clipboard.' });
      } else {
        // very old browsers fallback
        const tmp = document.createElement('textarea');
        tmp.value = url;
        tmp.setAttribute('readonly', '');
        tmp.style.position = 'absolute';
        tmp.style.left = '-9999px';
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        document.body.removeChild(tmp);
        toast({ title: 'Link copied', description: 'Product URL copied to clipboard.' });
      }
    } catch (err) {
      console.error('Share/copy failed', err);
      toast({ title: 'Unable to share', description: 'Could not copy link — please try manually.' });
    }
  };

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) *
        100
      )
      : 0;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsCartOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>{product.name} – Matica.life</title>
        <meta
          name="description"
          content={
            product.description ||
            "Handcrafted artisan piece from Matica.life – premium pottery and decor."
          }
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header
          onOpenCart={() => setIsCartOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        <main className="pt-20 md:pt-24 pb-16">
          {/* Top section: breadcrumb + main layout */}
          <section className="border-b border-border/60 bg-card/40">
            <div className="container mx-auto px-4 py-6 md:py-8">
              {/* Breadcrumb + Back */}
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center flex-wrap gap-2 text-xs md:text-sm text-muted-foreground">
                  <Link
                    to="/"
                    className="hover:text-primary transition-colors"
                  >
                    Home
                  </Link>
                  <span>/</span>
                  <Link
                    to="/shop"
                    className="hover:text-primary transition-colors"
                  >
                    Shop
                  </Link>
                  <span>/</span>
                  <Link
                    to={`/shop?category=${encodeURIComponent(product.category?.name || "")}`}
                    className="hover:text-primary transition-colors text-foreground/80"
                  >
                    {product.category?.name}
                  </Link>

                  <span>/</span>
                  <span className="text-foreground font-medium line-clamp-1">
                    {product.name}
                  </span>
                </div>

                <Link
                  to="/shop"
                  className="hidden md:inline-flex items-center text-xs md:text-sm text-muted-foreground hover:text-primary"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Shop
                </Link>
              </div>

              {/* Main layout */}
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start">
                {/* Image side */}
                {/* IMAGE GALLERY */}
                <div className="relative">

                  {/* highlight glow */}
                  <div className="absolute -inset-4 bg-gradient-to-tr from-primary/10 via-accent/5 to-transparent rounded-3xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  {/* Main image container */}
                  <div className="relative rounded-3xl overflow-hidden bg-muted/60 shadow-soft">
                    <img
                      src={selectedImage}
                      alt={product.name}
                      className="w-full h-full object-cover transition-all duration-500 ease-out hover:scale-[1.05]"
                    />

                    {/* Left Arrow */}
                    {product.images.length > 1 && (
                      <button
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-foreground shadow-md rounded-full p-2 transition"
                        onClick={prevImage}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </button>
                    )}

                    {/* Right Arrow */}
                    {product.images.length > 1 && (
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-foreground shadow-md rounded-full p-2 transition"
                        onClick={nextImage}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Floating labels */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                    {product.new && (
                      <Badge variant="default" className="bg-primary">New Arrival</Badge>
                    )}
                    {product.featured && (
                      <Badge variant="secondary">Editor’s pick</Badge>
                    )}
                    {discount > 0 && (
                      <Badge variant="destructive">Save {discount}%</Badge>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {product.images.length > 1 && (
                    <div className="mt-4 grid grid-cols-5 gap-3">
                      {product.images.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedIndex(index)}
                          className={cn(
                            "relative rounded-xl overflow-hidden border transition-all",
                            selectedIndex === index
                              ? "border-primary ring-2 ring-primary/40"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <img
                            src={img}
                            alt={`Thumbnail ${index}`}
                            className="object-cover w-full h-20"
                          />

                          {/* active selection overlay */}
                          {selectedIndex === index && (
                            <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>


                {/* Info side */}
                <div className="space-y-6">
                  {/* Title + rating */}
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-primary">
                      Matica.life Collection
                    </p>
                    <h1 className="font-display text-3xl md:text-4xl text-foreground">
                      {product.name}
                    </h1>

                    <div className="flex items-center gap-3 text-sm">
                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-4 h-4",
                              i < Math.round(product.rating)
                                ? "text-amber-500 fill-amber-500"
                                : "text-muted-foreground/30"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-muted-foreground">
                        {product.rating.toFixed(1)} · {product.reviews} reviews
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded-full border",
                          product.inStock
                            ? "border-emerald-500/40 text-emerald-600 bg-emerald-50/60"
                            : "border-muted-foreground/40 text-muted-foreground bg-muted/40"
                        )}
                      >
                        {product.inStock ? "In stock" : "Currently sold out"}
                      </span>
                    </div>
                  </div>

                  {/* Price block */}
                  <div className="flex items-end gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-semibold text-primary">
                          ₹{product.price.toLocaleString("en-IN")}
                        </span>
                        {product.originalPrice && (
                          <span className="text-base text-muted-foreground line-through">
                            ₹{product.originalPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        All prices inclusive of GST.
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      {product.description ||
                        "Hand-thrown pottery with natural glazes. Slight variations in color, texture, and form are part of the character and charm of each piece."}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-4">
                    {/* Quantity + buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                      <div className="flex items-center bg-muted rounded-full px-2 py-1 w-fit">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                          onClick={() =>
                            setQuantity((q) => Math.max(1, q - 1))
                          }
                        >
                          –
                        </Button>
                        <span className="px-4 text-sm font-medium">
                          {quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                          onClick={() =>
                            setQuantity((q) => Math.min(9, q + 1))
                          }
                        >
                          +
                        </Button>
                      </div>

                      <div className="flex flex-1 gap-3">
                        <Button
                          disabled={!product.inStock}
                          onClick={handleAddToCart}
                          className="flex-1 btn-primary h-12 text-sm font-semibold"
                        >
                          Add to Cart
                        </Button>
                        <Button
                          variant="outline"
                          className="h-12 px-4 text-sm gap-2"
                          onClick={() => {
                            if (!product.inStock) return;
                            handleAddToCart();
                            // later: redirect to /checkout
                          }}
                          disabled={!product.inStock}
                        >
                          <Sparkles className="w-4 h-4" />
                          Buy Now
                        </Button>
                      </div>
                    </div>

                    {/* Wishlist & share row */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Glassy circular wrapper to match other buttons */}
                      <div
                        className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm shadow-md flex items-center justify-center transition-transform duration-300 hover:scale-110"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <WishlistButton
                          productId={product.id}
                          size="md"
                          onAuthRequired={() => setIsAuthOpen(true)}
                          onClick={(e) => e.stopPropagation()}
                          className="p-0"
                        />
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Save to wishlist
                      </div>

                      {/* small share placeholder — keep simple and subtle */}
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                        onClick={handleShare}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" />
                          <path d="M16 6l-4-4-4 4" />
                          <path d="M12 2v14" />
                        </svg>
                        Share
                      </button>
                    </div>

                  </div>

                  {/* Meta info cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border/60">
                    <div className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Fast Shipping
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Dispatched from our Jaipur studio in 2–4 working days.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Secure Packaging
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Double-layered, shock-proof packaging for fragile pieces.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Authentic Craft
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Each piece is artisan-made and quality checked by hand.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Details / story / care */}
          <section className="py-12 md:py-16">
            <div className="container mx-auto px-4 grid gap-10 lg:grid-cols-[1.1fr_minmax(0,1fr)]">
              {/* Story */}
              <div className="space-y-6">
                <h2 className="font-display text-xl md:text-2xl text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Why this piece matters
                </h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  Every Matica.life piece is crafted in small batches. Slight
                  variations in glaze, form, and texture are not flaws — they’re
                  the fingerprints of the artisan who made it. This ensures that
                  the piece you receive is truly one-of-a-kind.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Handcrafted in India by independent artisans</li>
                  <li>• Small-batch production, no mass manufacturing</li>
                  <li>• Designed to be both functional and decorative</li>
                </ul>
              </div>

              {/* Care / shipping */}
              <div className="grid gap-6">
                <div className="bg-card border border-border/70 rounded-2xl p-5 md:p-6">
                  <h3 className="font-display text-base md:text-lg text-foreground mb-3">
                    Care Instructions
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Gently wipe with a soft, damp cloth. Avoid harsh detergents
                    and metal scrubs. Not recommended for sudden temperature
                    changes (like freezer to microwave).
                  </p>
                </div>
                <div className="bg-card border border-border/70 rounded-2xl p-5 md:p-6">
                  <h3 className="font-display text-base md:text-lg text-foreground mb-3">
                    Shipping & Returns
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Free shipping in India on orders above ₹999. Easy 7-day
                    returns if the product arrives damaged or not as described.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Related products */}
          {relatedProducts.length > 0 && (
            <section className="py-12 md:py-20 bg-card/40 border-t border-border/60">
              <div className="container mx-auto px-4">
                <div className="flex items-end justify-between gap-3 mb-8">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-primary mb-2">
                      You may also like
                    </p>
                    <h2 className="font-display text-2xl md:text-3xl text-foreground">
                      More from this collection
                    </h2>
                  </div>
                  <Link
                    to="/shop"
                    className="hidden md:inline-flex items-center text-sm text-muted-foreground hover:text-primary"
                  >
                    View all products
                  </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {relatedProducts.map((related, index) => (
                    <ProductCard
                      key={related.id}
                      product={related}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 80}ms` }}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>

        <Footer />

        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
        />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />
      </div>
    </>
  );
};

export default ProductDetail;
