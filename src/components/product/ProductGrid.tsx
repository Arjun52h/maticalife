import React from "react";
import ProductCard from "./ProductCard";
import type { Product } from "@/types";

interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  emptyMessage = "No pieces match this filter yet.",
}) => {
  if (!products.length) {
    return (
      <div className="py-10 text-center text-sm text-darktext/70">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          className="bg-white"
          style={{ animationDelay: `${index * 60}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
