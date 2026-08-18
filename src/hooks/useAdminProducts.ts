import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { AdminProduct, ProductDraft } from "../types/admin";
import type {
  Category,
  ColorToken,
  ProductImage,
  ProductVariant,
} from "../types/product";

type AdminProductRow = {
  id: number;
  slug: string;
  name: string;
  category: Category;
  colors: ColorToken[];
  price: number;
  description: string;
  medidas: string;
  peso: string | null;
  peso_gramos: number | null;
  material: string | null;
  cuidados: string | null;
  variants: ProductVariant[] | null;
  images: ProductImage[] | null;
  in_stock: boolean;
  stock: number | null;
  sku: string | null;
  cost: number | null;
  is_bundle: boolean;
};

function mapProduct(row: AdminProductRow): AdminProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    colors: row.colors ?? [],
    price: row.price,
    description: row.description,
    medidas: row.medidas,
    peso: row.peso ?? undefined,
    pesoGramos: row.peso_gramos ?? undefined,
    material: row.material ?? undefined,
    cuidados: row.cuidados ?? undefined,
    variants: row.variants?.length ? row.variants : undefined,
    images: row.images ?? [],
    inStock: row.in_stock,
    stock: row.stock,
    sku: row.sku,
    cost: row.cost,
    isBundle: row.is_bundle,
  };
}

/** Catálogo desde Supabase, sin el fallback al catálogo local: en el panel
 *  conviene ver un error antes que editar datos que no se van a guardar. */
export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: async (): Promise<AdminProduct[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: false });
      if (error) throw error;
      return (data as AdminProductRow[]).map(mapProduct);
    },
    staleTime: 60 * 1000,
  });
}

export function draftFromProduct(product: AdminProduct): ProductDraft {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    colors: product.colors,
    price: product.price,
    stock: product.stock,
    sku: product.sku ?? "",
    cost: product.cost,
    isBundle: product.isBundle,
    description: product.description,
    medidas: product.medidas,
    peso: product.peso ?? "",
    pesoGramos: product.pesoGramos ?? null,
    material: product.material ?? "",
    cuidados: product.cuidados ?? "",
    inStock: product.inStock,
    images: product.images,
    variants: product.variants ?? [],
  };
}

export function emptyDraft(): ProductDraft {
  return {
    id: null,
    slug: "",
    name: "",
    category: "almohadones",
    colors: [],
    price: 0,
    stock: null,
    sku: "",
    cost: null,
    isBundle: false,
    description: "",
    medidas: "",
    peso: "",
    pesoGramos: null,
    material: "",
    cuidados: "",
    inStock: true,
    images: [],
    variants: [],
  };
}

function rowFromDraft(draft: ProductDraft) {
  return {
    // Los ids son los de Tienda Nube. Para un producto nuevo generamos uno
    // por timestamp: queda por encima de los existentes, así "ordenar por id
    // descendente" sigue significando "lo último que subí".
    id: draft.id ?? Math.floor(Date.now() / 1000),
    slug: draft.slug,
    name: draft.name,
    category: draft.category,
    colors: draft.colors,
    price: draft.price,
    description: draft.description,
    medidas: draft.medidas,
    peso: draft.peso || null,
    peso_gramos: draft.pesoGramos,
    material: draft.material || null,
    cuidados: draft.cuidados || null,
    variants: draft.variants,
    images: draft.images,
    in_stock: draft.inStock,
    stock: draft.stock,
    sku: draft.sku || null,
    cost: draft.cost,
    is_bundle: draft.isBundle,
  };
}

/** Alta y edición: un upsert por id cubre los dos casos. */
export function useSaveProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: ProductDraft) => {
      const { error } = await supabase
        .from("products")
        .upsert(rowFromDraft(draft), { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      // La tienda usa otra query key: también hay que refrescarla
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

/** Cambios rápidos desde el listado o el centro de distribución. */
export function useQuickUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: number;
      patch: {
        price?: number;
        stock?: number | null;
        inStock?: boolean;
        cost?: number | null;
        isBundle?: boolean;
      };
    }) => {
      const row: Record<string, unknown> = {};
      if (patch.price !== undefined) row.price = patch.price;
      if (patch.stock !== undefined) row.stock = patch.stock;
      if (patch.inStock !== undefined) row.in_stock = patch.inStock;
      if (patch.cost !== undefined) row.cost = patch.cost;
      if (patch.isBundle !== undefined) row.is_bundle = patch.isBundle;

      const { error } = await supabase.from("products").update(row).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
