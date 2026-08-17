import { useQuery } from "@tanstack/react-query";
import { products as localCatalog } from "../data/products";
import { supabase } from "../lib/supabase";
import type {
  Category,
  ColorToken,
  Product,
  ProductImage,
  ProductVariant,
} from "../types/product";

type ProductRow = {
  id: number;
  slug: string;
  name: string;
  category: Category;
  colors: ColorToken[];
  price: number;
  description: string;
  medidas: string;
  peso: string | null;
  material: string | null;
  cuidados: string | null;
  variants: ProductVariant[] | null;
  images: ProductImage[];
  in_stock: boolean;
};

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    colors: row.colors,
    price: row.price,
    description: row.description,
    medidas: row.medidas,
    peso: row.peso ?? undefined,
    material: row.material ?? undefined,
    cuidados: row.cuidados ?? undefined,
    variants: row.variants?.length ? row.variants : undefined,
    images: row.images,
    inStock: row.in_stock,
  };
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("id");
        if (error) throw error;
        if (data?.length) return (data as ProductRow[]).map(mapRow);
      } catch (error) {
        // Sin Supabase configurado (o sin la migración corrida) la tienda
        // igual muestra el catálogo espejo de Tienda Nube.
        console.warn(
          "No se pudo leer products de Supabase, uso el catálogo local:",
          error,
        );
      }
      return localCatalog;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
