// import { useQuery } from "@tanstack/react-query";
// import { supabase } from "@/lib/supabaseClient";
// import type { Product } from "@/types";
// import { mapDbProduct } from "./useProducts"; // export it from there OR dupe logic

// export function useProduct(id?: string) {
//   return useQuery<Product | null>({
//     queryKey: ["product", id],
//     enabled: !!id,
//     queryFn: async () => {
//       if (!id) return null;

//       const { data, error } = await supabase
//         .from("products")
//         .select("*")
//         .eq("id", Number(id)) // because DB is bigint
//         .single();

//       if (error) {
//         if (error.code === "PGRST116") return null; // no rows
//         throw error;
//       }

//       return data ? mapDbProduct(data) : null;
//     },
//   });
// }
