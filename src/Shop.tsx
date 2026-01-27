import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Grid3X3, LayoutList } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import CartDrawer from '@/components/CartDrawer';
import AuthModal from '@/components/AuthModal';
import { useProducts, useCategories } from "@/hooks/useProducts";
import type { Product } from "@/types";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import ScrollToTopButton from '@/components/ScrollToTopButton';

const Shop: React.FC = () => {
  const { data: dbProducts, isLoading: productsLoading } = useProducts();
  const { data: dbCategories } = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("q") || "";
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  // const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [sortBy, setSortBy] = useState('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceFilter, setPriceFilter] = useState<
    "all" | "under-500" | "500-1000" | "1000-2000" | "above-2000"
  >("all");

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    const newParams = new URLSearchParams(searchParams.toString()); // create a new object
    if (value) {
      newParams.set("q", value);
    } else {
      newParams.delete("q");
    }
    setSearchParams(newParams, { replace: true }); // <- replace instead of push
  };


  const getCategoryCount = (name: string) =>
    (dbProducts ?? []).filter((p) => p.category?.name === name).length;

  const getPriceFilterLabel = () => {
    switch (priceFilter) {
      case "under-500":
        return "Under ₹500";
      case "500-1000":
        return "₹500 – ₹1000";
      case "1000-2000":
        return "₹1000 – ₹2000";
      case "above-2000":
        return "Above ₹2000";
      default:
        return "";
    }
  };

  const filteredProducts = useMemo(() => {
    const source: Product[] = dbProducts ?? [];
    let result = [...source];

    // Search
    if (searchQuery) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category
    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category?.name === selectedCategory);
    }


    // 🔥 Price range
    switch (priceFilter) {
      case "under-500":
        result = result.filter((p) => p.price < 500);
        break;
      case "500-1000":
        result = result.filter((p) => p.price >= 500 && p.price <= 1000);
        break;
      case "1000-2000":
        result = result.filter((p) => p.price > 1000 && p.price <= 2000);
        break;
      case "above-2000":
        result = result.filter((p) => p.price > 2000);
        break;
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        result.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return result;
  }, [dbProducts, searchQuery, selectedCategory, sortBy, priceFilter]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);

    const newParams = new URLSearchParams(searchParams.toString());
    if (category === 'All') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    setSearchParams(newParams, { replace: true });
  };

  const handlePriceFilterChange = (price: typeof priceFilter) => {
    setPriceFilter(price);

    const newParams = new URLSearchParams(searchParams.toString());
    if (price === "all") {
      newParams.delete("price");
    } else {
      newParams.set("price", price);
    }
    setSearchParams(newParams, { replace: true });
  };
  useEffect(() => {
    const priceParam = searchParams.get("price") as typeof priceFilter;
    if (priceParam) setPriceFilter(priceParam);
  }, [searchParams]);



  return (
    <>
      <Helmet>
        <title>Shop All Products - Matica.life | Artisan Products Online</title>
        <meta name="description" content="Browse our complete collection of handcrafted artisan products. Terracotta vases, ceramic plates, home decor, and more. Free shipping on orders above ₹999." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header
          onOpenCart={() => setIsCartOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        <main className="pt-20 md:pt-24">
          {/* Page Header */}
          <div className="bg-card/50 border-b border-border py-12 md:py-16">
            <div className="container mx-auto px-4">
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4">
                Shop All Products
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Discover our curated collection of handcrafted products. Each piece is made with love by skilled Indian artisans.
              </p>
            </div>
          </div>

          <div className="container mx-auto px-3 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar Filters - Desktop */}
              <aside className="hidden lg:block w-72 flex-shrink-0">
                <div className="sticky top-24">
                  <div className="sidebar-scroll max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 space-y-6 pl-2">

                    {/* Search */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">Search</h3>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search products..."
                          value={searchQuery}
                          // onChange={(e) => setSearchQuery(e.target.value)}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Categories */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">Categories</h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleCategoryChange('All')}
                          className={cn(
                            "w-full text-left px-4 py-2 rounded-lg transition-colors",
                            selectedCategory === 'All'
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted"
                          )}
                        >
                          All Products ({dbProducts?.length ?? 0})
                        </button>
                        {dbCategories?.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.name)}
                            className={cn(
                              "w-full text-left px-4 py-2 rounded-lg transition-colors",
                              selectedCategory === cat.name
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {cat.name} ({getCategoryCount(cat.name)})
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">Price Range</h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => setPriceFilter("all")}
                          className={cn(
                            "w-full text-left px-4 py-2 rounded-lg transition-colors",
                            priceFilter === "all"
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted"
                          )}
                        >
                          Any Price
                        </button>
                        <button
                          onClick={() => handlePriceFilterChange("under-500")}
                          className={cn(
                            "w-full text-left px-4 py-2 rounded-lg transition-colors",
                            priceFilter === "under-500"
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted"
                          )}
                        >
                          Under ₹500
                        </button>
                        <button
                          onClick={() => setPriceFilter("500-1000")}
                          className={cn(
                            "w-full text-left px-4 py-2 rounded-lg transition-colors",
                            priceFilter === "500-1000"
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted"
                          )}
                        >
                          ₹500 – ₹1000
                        </button>
                        <button
                          onClick={() => setPriceFilter("1000-2000")}
                          className={cn(
                            "w-full text-left px-4 py-2 rounded-lg transition-colors",
                            priceFilter === "1000-2000"
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted"
                          )}
                        >
                          ₹1000 – ₹2000
                        </button>
                        <button
                          onClick={() => setPriceFilter("above-2000")}
                          className={cn(
                            "w-full text-left px-4 py-2 rounded-lg transition-colors",
                            priceFilter === "above-2000"
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted"
                          )}
                        >
                          Above ₹2000
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <div className="flex-1">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <p className="text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span> products
                  </p>

                  <div className="flex items-center gap-3">
                    {/* Mobile Filter Button */}
                    <Button
                      variant="outline"
                      className="lg:hidden gap-2"
                      onClick={() => setIsFilterOpen(true)}
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      Filters
                    </Button>

                    {/* Sort */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="h-10 px-4 rounded-lg border border-border bg-background text-sm"
                    >
                      <option value="featured">Featured</option>
                      <option value="newest">Newest</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Best Rating</option>
                    </select>

                    {/* View Mode */}
                    <div className="hidden md:flex items-center gap-1 p-1 bg-muted rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("w-8 h-8", viewMode === 'grid' && "bg-background shadow-sm")}
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("w-8 h-8", viewMode === 'list' && "bg-background shadow-sm")}
                        onClick={() => setViewMode('list')}
                      >
                        <LayoutList className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Active Filters */}
                {(selectedCategory !== 'All' || searchQuery || priceFilter !== "all") && (
                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span className="text-sm text-muted-foreground">Active filters:</span>

                    {selectedCategory !== 'All' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleCategoryChange('All')}
                      >
                        {selectedCategory}
                        <X className="w-3 h-3" />
                      </Button>
                    )}

                    {searchQuery && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          setSearchQuery('');
                          searchParams.delete('q'); // remove from URL
                          setSearchParams(searchParams);
                        }}
                      >
                        "{searchQuery}"
                        <X className="w-3 h-3" />
                      </Button>
                    )}

                    {priceFilter !== "all" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          setPriceFilter("all");
                          searchParams.delete('price'); // if you want price in URL too
                          setSearchParams(searchParams);
                        }}
                      >
                        {getPriceFilterLabel()}
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}


                {/* Products Grid */}
                {productsLoading ? (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground">Loading products…</p>
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div
                    className={cn(
                      "grid gap-4 md:gap-6",
                      viewMode === "grid" ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1"
                    )}
                  >
                    {filteredProducts.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        viewMode={viewMode}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-xl text-muted-foreground mb-4">No products found</p>
                    <Button
                      onClick={() => {
                        setSearchQuery("");
                        handleCategoryChange("All");
                        setPriceFilter("all");
                        searchParams.delete('q');
                        searchParams.delete('category');
                        searchParams.delete('price'); // optional
                        setSearchParams(searchParams);
                      }}
                    >
                      Clear Filters
                    </Button>

                  </div>
                )}

              </div>
            </div>
          </div>
        </main>

        <Footer />

        {/* Mobile Filter Drawer */}
        {isFilterOpen && (
          <>
            <div
              className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setIsFilterOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-80 bg-background z-50 p-6 overflow-y-auto lg:hidden animate-slide-in-right">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-semibold">Filters</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Mobile Filter Content */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Search</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-3">Categories</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => { handleCategoryChange('All'); setIsFilterOpen(false); }}
                      className={cn(
                        "w-full text-left px-4 py-2 rounded-lg transition-colors",
                        selectedCategory === 'All'
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      All Products
                    </button>
                    {dbCategories?.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryChange(cat.name)}
                        className={cn(
                          "w-full text-left px-4 py-2 rounded-lg transition-colors",
                          selectedCategory === cat.name
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {cat.name} ({getCategoryCount(cat.name)})

                      </button>
                    ))}
                  </div>
                </div>
                {/* Price Range */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Price Range</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setPriceFilter("all")}
                      className={cn(
                        "w-full text-left px-4 py-2 rounded-lg transition-colors",
                        priceFilter === "all"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      Any Price
                    </button>
                    <button
                      onClick={() => handlePriceFilterChange("under-500")}
                      className={cn(
                        "w-full text-left px-4 py-2 rounded-lg transition-colors",
                        priceFilter === "under-500"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      Under ₹500
                    </button>
                    <button
                      onClick={() => setPriceFilter("500-1000")}
                      className={cn(
                        "w-full text-left px-4 py-2 rounded-lg transition-colors",
                        priceFilter === "500-1000"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      ₹500 – ₹1000
                    </button>
                    <button
                      onClick={() => setPriceFilter("1000-2000")}
                      className={cn(
                        "w-full text-left px-4 py-2 rounded-lg transition-colors",
                        priceFilter === "1000-2000"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      ₹1000 – ₹2000
                    </button>
                    <button
                      onClick={() => setPriceFilter("above-2000")}
                      className={cn(
                        "w-full text-left px-4 py-2 rounded-lg transition-colors",
                        priceFilter === "above-2000"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      Above ₹2000
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
        />

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />

        <ScrollToTopButton />
      </div>
    </>
  );

};

export default Shop;