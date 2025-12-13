import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Heart, Star, Eye, X } from 'lucide-react';
import type { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import WishlistButton from '@/components/wishlist/WishlistButton';


interface ProductCardProps {
  product: Product;
  className?: string;
  style?: React.CSSProperties;
  viewMode?: "grid" | "list";
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className,
  style,
  viewMode = "grid",
}) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const goToDetail = () => {
    navigate(`/product/${product.id}`);
  };

  const gallery = product.images?.length ? product.images : [product.image];
  const [qvIndex, setQvIndex] = useState(0);

  const nextQv = () => setQvIndex(i => (i + 1) % gallery.length);
  const prevQv = () =>
    setQvIndex(i => (i === 0 ? gallery.length - 1 : i - 1));


  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsQuickViewOpen(false);
      }
    };
    if (isQuickViewOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isQuickViewOpen]);

  // Close modal on Esc key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsQuickViewOpen(false);
    };
    if (isQuickViewOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isQuickViewOpen]);

  return (
    <>
      <div
        className={cn(
          "product-card group relative cursor-pointer",
          viewMode === "list" ? "flex flex-row gap-4" : "flex flex-col",
          className
        )}
        style={style}
        onClick={goToDetail}
      >
        {/* Image Container */}
        <div
          className={cn(
            "relative image-zoom bg-muted/50",
            viewMode === "list"
              ? "w-40 h-40 flex-shrink-0 rounded-l-xl overflow-hidden"
              : "aspect-square"
          )}
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.new && (
              <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                New
              </span>
            )}
            {discount > 0 && (
              <span className="px-3 py-1 bg-destructive text-destructive-foreground text-xs font-semibold rounded-full">
                -{discount}%
              </span>
            )}
            {!product.inStock && (
              <span className="px-3 py-1 bg-muted text-muted-foreground text-xs font-semibold rounded-full">
                Out of Stock
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 
                opacity-0 group-hover:opacity-100 
                transition-all duration-300 
                translate-x-4 group-hover:translate-x-0 
                pointer-events-none">

            {/* Wishlist Button */}
            <WishlistButton
              productId={product.id}
              size="sm"
              className="pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            />


            {/* Quick View Button */}
            <Button
              size="icon"
              variant="secondary"
              className="
            pointer-events-auto
            w-9 h-9 rounded-full
            bg-background/90 backdrop-blur-sm shadow-md
            hover:bg-primary hover:text-primary-foreground
            transition-all duration-300
        "
              onClick={(e) => {
                e.stopPropagation();
                setIsQuickViewOpen(true);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>



          {/* Add to Cart Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            <Button
              onClick={(e) => { e.stopPropagation(); addToCart(product); }}
              disabled={!product.inStock}
              className="w-full btn-primary gap-2 backdrop-blur-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </Button>
          </div>
        </div>

        {/* Content */}
        <div
          className={cn(
            "p-4",
            viewMode === "list" ? "flex-1 flex flex-col justify-between" : ""
          )}
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            {product.category?.name}
          </p>

          <h3 className="font-display text-lg font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-3.5 h-3.5",
                    i < Math.floor(product.rating)
                      ? "text-amber-500 fill-amber-500"
                      : "text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.reviews})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-primary">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{product.originalPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {isQuickViewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-6">
          <div
            ref={modalRef}
            className="
              bg-background w-11/12 max-w-xl rounded-lg shadow-lg relative p-4 
              animate-fade-in
              max-h-[90vh] overflow-y-auto
            "
          >

            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3"
              onClick={() => setIsQuickViewOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>

            <div className="flex flex-col md:flex-row gap-6 md:gap-4">
              {/* Image clickable */}
              {/* QUICK VIEW IMAGE SLIDER */}
              <div className="relative w-full md:w-1/2 max-h-80 md:max-h-none">

                {/* Main Image */}
                <img
                  src={gallery[qvIndex]}
                  alt={product.name}
                  className="w-full max-h-80 md:max-h-none rounded-lg object-cover transition-all duration-500 cursor-pointer hover:scale-[1.03]"
                  onClick={() => { setIsQuickViewOpen(false); goToDetail(); }}
                />

                {/* <div className="relative w-full md:w-1/2 aspect-[4/3] md:aspect-auto">
                  <img
                    src={gallery[qvIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div> */}


                {/* Prev Arrow */}
                {gallery.length > 1 && (
                  <button
                    onClick={prevQv}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black shadow-md p-2 rounded-full"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </button>
                )}

                {/* Next Arrow */}
                {gallery.length > 1 && (
                  <button
                    onClick={nextQv}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black shadow-md p-2 rounded-full"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </button>
                )}

                {/* Thumbnails */}
                {/* Thumbnails - only show on md+ */}
                {gallery.length > 1 && (
                  <div className="hidden md:flex gap-2 mt-3 overflow-x-auto pb-1">
                    {gallery.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setQvIndex(i)}
                        className={cn(
                          "w-16 h-16 rounded-lg overflow-hidden border transition-all",
                          qvIndex === i
                            ? "border-primary ring-2 ring-primary/40"
                            : "border-border hover:border-primary/40"
                        )}
                      >
                        <img
                          src={img}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>


              <div className="flex-1 flex flex-col justify-between">
                <div>
                  {/* Title clickable */}
                  <h2
                    className="text-2xl font-semibold text-foreground mb-2 cursor-pointer"
                    onClick={() => { setIsQuickViewOpen(false); goToDetail(); }}
                  >
                    {product.name}
                  </h2>

                  <p className="text-muted-foreground mb-4">{product.description}</p>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-4 h-4",
                            i < Math.floor(product.rating)
                              ? "text-amber-500 fill-amber-500"
                              : "text-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({product.reviews})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl font-semibold text-primary">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        ₹{product.originalPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => addToCart(product)}
                  disabled={!product.inStock}
                  className="btn-primary w-full gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;
