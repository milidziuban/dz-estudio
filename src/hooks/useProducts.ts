import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type {
  Category,
  CollectionId,
  ColorToken,
  Product,
  ProductImage,
} from "../types/product";

type ProductRow = {
  id: number;
  slug: string;
  name: string;
  category: Category;
  collection: CollectionId;
  colors: ColorToken[];
  price: number;
  description: string;
  medidas: string;
  material: string;
  cuidados: string;
  edition_number: number;
  edition_total: number;
  images: ProductImage[];
  sales: number;
  created_at: string;
};

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    collection: row.collection,
    colors: row.colors,
    price: row.price,
    description: row.description,
    medidas: row.medidas,
    material: row.material,
    cuidados: row.cuidados,
    edition: { number: row.edition_number, total: row.edition_total },
    images: row.images,
    sales: row.sales,
    createdAt: row.created_at,
  };
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id");
      if (error) throw error;
      return (data as ProductRow[]).map(mapRow);
    },
    staleTime: 5 * 60 * 1000,
  });
}
