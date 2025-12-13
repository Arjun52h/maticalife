import React from "react";
import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useProducts";

const CategoriesSection: React.FC = () => {
  const { data: categories, isLoading, error } = useCategories();

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-primary font-medium mb-2 uppercase tracking-wide text-sm">
            Browse By Category
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground">
            Explore Our Collections
          </h2>
        </div>

        {/* Loading / error states */}
        {isLoading && (
          <p className="text-center text-sm text-muted-foreground">
            Loading categories…
          </p>
        )}

        {error && (
          <p className="text-center text-sm text-destructive">
            Could not load categories.
          </p>
        )}

        {!isLoading && !error && categories && categories.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No categories yet. Add rows to the <code>categories</code> table in Supabase.
          </p>
        )}

        {/* Categories Grid */}
        {categories && categories.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                to={`/shop?category=${encodeURIComponent(category.name)}`}
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` } as CSSProperties}
              >
                {/* Image */}
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent transition-opacity group-hover:from-foreground/90" />

                {/* Content */}
                <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-end">
                  <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
                    <h3 className="font-display text-xl md:text-2xl font-semibold text-background mb-1">
                      {category.name}
                    </h3>
                    <p className="text-background/80 text-sm mb-3 hidden md:block">
                      {category.description}
                    </p>
                    <div className="flex items-center gap-2 text-background/90 text-sm font-medium">
                      <span>{category.count} Products</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesSection;
