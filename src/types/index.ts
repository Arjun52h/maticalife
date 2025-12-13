export interface Product {
  id: string;
  name: string;
  description: string;
  subtitle?: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  category: {
    id: string;
    name: string;
  };
  rating: number;
  reviews: number;
  inStock: boolean;
  featured?: boolean;
  new?: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  count: number;
}
