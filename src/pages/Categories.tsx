import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import AuthModal from "@/components/AuthModal";
import { useCategories } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

const Categories: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const { data: dbCategories, isLoading, error } = useCategories();

  return (
    <>
      <Helmet>
        <title>
          Product Categories - Matica.life | Browse Artisan Collections
        </title>
        <meta
          name="description"
          content="Explore our categories: terracotta vases, ceramic dinnerware, planters, and traditional decor. Find the perfect handcrafted piece."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header
          onOpenCart={() => setIsCartOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        <main className="pt-20 md:pt-24">
          {/* Page Header */}
          <div className="bg-card/50 border-b border-border py-12 md:py-16">
            <div className="container mx-auto px-4 text-center">
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4">
                Shop by Category
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explore our diverse collection of handcrafted products, organized
                by type to help you find exactly what you're looking for.
              </p>
            </div>
          </div>

          <div className="container mx-auto px-4 py-12 md:py-16">
            {/* Loading state */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-muted animate-pulse"
                  />
                ))}
              </div>
            )}

            {/* Error / empty state */}
            {!isLoading && (!!error || !dbCategories || dbCategories.length === 0) && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-3">
                  No categories available right now.
                </p>
                <p className="text-xs text-muted-foreground/80">
                  Check your Supabase <code>categories</code> table or
                  <code>useCategories</code> hook.
                </p>
              </div>
            )}

            {/* Categories grid from DB */}
            {!isLoading && dbCategories && dbCategories.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {dbCategories.map((category: any, index: number) => {
                  const image =
                    category.image ||
                    category.image_url ||
                    category.imageUrl ||
                    "";
                  const count =
                    category.count ??
                    category.product_count ??
                    category.productCount ??
                    0;

                  return (
                    <Link
                      key={category.id}
                      to={`/shop?category=${encodeURIComponent(category.name)}`}
                      className="group relative aspect-[16/9] rounded-2xl overflow-hidden animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Image */}
                      {image ? (
                        <img
                          src={image}
                          alt={category.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
                          No image
                        </div>
                      )}

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent transition-all group-hover:from-foreground/90" />

                      {/* Content */}
                      <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                        <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
                          <h2 className="font-display text-2xl md:text-3xl font-semibold text-background mb-2">
                            {category.name}
                          </h2>
                          {category.description && (
                            <p className="text-background/80 mb-4">
                              {category.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-background/90 font-medium">
                            <span>
                              {count} {count === 1 ? "Product" : "Products"}
                            </span>
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
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
};

export default Categories;
