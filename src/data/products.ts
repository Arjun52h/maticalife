import type { Product, Category } from '@/types';

export const categories: Category[] = [
];

export const products: Product[] = [
];

export const featuredProducts = products.filter(p => p.featured);
export const newArrivals = products.filter(p => p.new);
