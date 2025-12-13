import React, { useMemo } from "react";
import type { CSSProperties } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ProductCard from "./ProductCard";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/types";

const NewArrivalsSection: React.FC = () => {
  const { data: products, isLoading, error } = useProducts();

  const displayProducts: Product[] = useMemo(() => {
    if (!products || products.length === 0) return [];
    const newOnes = products.filter((p) => p.new);
    if (newOnes.length > 0) return newOnes.slice(0, 4);
    return products.slice(0, 4); // fallback like you had before
  }, [products]);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-primary font-medium mb-2 uppercase tracking-wide text-sm">
              <Sparkles className="w-4 h-4" />
              Just Arrived
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground">
              New Arrivals
            </h2>
          </div>
          <Link to="/shop">
            <Button
              variant="outline"
              className="gap-2 group border-primary/30 hover:bg-primary hover:text-primary-foreground"
            >
              See All New
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* States */}
        {isLoading && (
          <p className="text-sm text-muted-foreground py-10">
            Loading new arrivals…
          </p>
        )}

        {error && (
          <p className="text-sm text-destructive py-10">
            Could not load new arrivals.
          </p>
        )}

        {!isLoading && !error && displayProducts.length === 0 && (
          <p className="text-sm text-muted-foreground py-10">
            No new arrivals yet. Mark some products as <code>is_new = true</code> in Supabase.
          </p>
        )}

        {/* Products Grid */}
        {displayProducts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {displayProducts.slice(0, 4).map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` } as CSSProperties}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default NewArrivalsSection;
