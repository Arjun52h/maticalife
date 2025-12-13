import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { Product, Category } from "@/types";

type DbImage = {
  image: string;
  sort_order?: number;
};


export function mapDbProduct(row: any): Product {
  const createdAt = row.created_at;
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const isNew = createdAt ? (Date.now() - new Date(createdAt).getTime()) <= THIRTY_DAYS : false;

  return {
    id: String(row.id),
    name: row.name,
    description: row.description,
    subtitle: row.subtitle ?? undefined,
    price: row.price,
    originalPrice: row.original_price ?? undefined,

    image: row.image,

    images: Array.isArray(row.images)
      ? (row.images as DbImage[])
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map(img => img.image)
      : [],

    category: {
      id: String(row.category_id),
      name: row.category_name,
    },

    rating: Number(row.rating ?? 0),
    reviews: row.reviews ?? 0,
    inStock: row.in_stock,
    featured: row.featured ?? false,
    new: isNew,
    createdAt,
  };
}


export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(id, name),
          images:product_images(image, sort_order)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map(row => mapDbProduct({
        ...row,
        category_id: row.category?.id,
        category_name: row.category?.name,
        images: row.images,
      }));
    },
  });
}

export function useProduct(id?: string) {
  return useQuery<Product | null>({
    queryKey: ["product", id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(id, name),
          images:product_images(image, sort_order)
        `)

        .eq("id", Number(id))
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }

      return data
        ? mapDbProduct({
          ...data,
          category_id: data.category?.id,
          category_name: data.category?.name,
          images: data.images,
        })
        : null;
    },
  });
}


function mapDbCategory(row: any): Category {
  return {
    id: String(row.id),
    name: row.name,
    description: row.description,
    image: row.image,
    count: row.count ?? 0,
  };
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      return (data ?? []).map(mapDbCategory);
    },
  });
}


export function useFeaturedProducts(limit?: number) {
  return useQuery<Product[]>({
    queryKey: ["featured-products", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(id, name),
          images:product_images(image, sort_order)
        `)
        .eq("featured", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      let list = (data ?? []).map(row =>
        mapDbProduct({
          ...row,
          category_id: row.category?.id,
          category_name: row.category?.name,
          images: row.images,
        })
      );

      if (typeof limit === "number") {
        list = list.slice(0, limit);
      }

      return list;
    },
  });
}

