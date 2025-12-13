import React from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { useFeaturedProducts } from "@/hooks/useProducts";

const FeaturedProducts: React.FC = () => {
  const { data: featured, isLoading, error } = useFeaturedProducts(4);

  return (
    <section className="py-16 md:py-24 bg-card/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12">
          <div>
            <p className="text-primary font-medium mb-2 uppercase tracking-wide text-sm">
              Handpicked For You
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground">
              Featured Products
            </h2>
          </div>
          <Link to="/shop">
            <Button
              variant="outline"
              className="gap-2 group border-primary/30 hover:bg-primary hover:text-primary-foreground"
            >
              View All Products
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* States */}
        {isLoading && (
          <div className="py-10 text-sm text-muted-foreground">
            Loading featured products…
          </div>
        )}

        {error && (
          <div className="py-10 text-sm text-destructive">
            Could not load featured products.
          </div>
        )}

        {!isLoading && !error && (!featured || featured.length === 0) && (
          <div className="py-10 text-sm text-muted-foreground">
            No featured products yet. Mark some products as <code>featured</code> in Supabase to show them here.
          </div>
        )}

        {/* Products Grid */}
        {featured && featured.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featured.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` } as React.CSSProperties}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
