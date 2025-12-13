import React from "react";
import { ShoppingCart, Heart, Star, Eye } from "lucide-react";
import type { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  product: Product;
  className?: string;
  style?: React.CSSProperties;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className,
  style,
}) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const discount = product.originalPrice
    ? Math.round(
      ((product.originalPrice - product.price) / product.originalPrice) * 100
    )
    : 0;

  const goToDetail = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div
      className={cn("product-card group relative cursor-pointer", className)}
      style={style}
      onClick={goToDetail} // 🔥 whole card navigates
    >
      {/* Image Container */}
      <div className="relative image-zoom aspect-square bg-muted/50">
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
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
          {/* Wishlist – still visual only */}
          <Button
            size="icon"
            variant="secondary"
            className="w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm shadow-md hover:bg-primary hover:text-primary-foreground transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <Heart className="w-4 h-4" />
          </Button>

          {/* 👁 Quick View -> Product Detail */}
          <Button
            size="icon"
            variant="secondary"
            className="w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm shadow-md hover:bg-primary hover:text-primary-foreground transition-all"
            onClick={(e) => {
              e.stopPropagation(); // don’t trigger parent onClick twice
              goToDetail();
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>

        {/* Add to Cart Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
          <Button
            onClick={(e) => {
              e.stopPropagation(); // prevent navigation, just add to cart
              if (!product.inStock) return;
              addToCart(product);
            }}
            disabled={!product.inStock}
            className="w-full btn-primary gap-2 backdrop-blur-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
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

        {/* Price */}
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
  );
};

export default ProductCard;
