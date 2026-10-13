import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { AdminProduct, AdminProductVariant, ProductDraft } from "../types/admin";
import type { Category, ColorToken, ProductImage } from "../types/product";

/** Variantes viejas, cargadas antes de que existiera el stock por variante,
 *  no van a traer la clave `stock` — se completa en null (sin control). */
type AdminProductVariantRow = {
  id: string;
  label: string;
  color: ColorToken;
  stock?: number | null;
};

function mapVariant(row: AdminProductVariantRow): AdminProductVariant {
  return {
    id: row.id,
    label: row.label,
    color: row.color,
    stock: row.stock ?? null,
  };
}

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
  variants: AdminProductVariantRow[] | null;
  images: ProductImage[] | null;
  in_stock: boolean;
  stock: number | null;
  sku: string | null;
  cost: number | null;
  is_bundle: boolean;
  orden: number;
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
    variants: row.variants?.length ? row.variants.map(mapVariant) : undefined,
    images: row.images ?? [],
    inStock: row.in_stock,
    stock: row.stock,
    sku: row.sku,
    cost: row.cost,
    isBundle: row.is_bundle,
    orden: row.orden,
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
        .order("orden")
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

type StockActual = {
  stock: number | null;
  variants: AdminProductVariantRow[] | null;
};

/** La ficha no mueve unidades: eso se hace desde Distribución y queda
 *  anotado en `stock_movimientos`. Lo único que la ficha decide es si una
 *  línea controla stock o no (null ↔ número). Así que al guardar, donde la
 *  base ya tiene un número se conserva el de la base —que pudo cambiar por un
 *  despacho o una producción mientras la ficha estaba abierta— y el número
 *  del borrador solo vale para la línea que recién prende el control. */
function conservarStock(draft: ProductDraft, actual: StockActual): ProductDraft {
  const stock =
    draft.stock === null ? null : (actual.stock ?? draft.stock);
  const variants = draft.variants.map((variant) => {
    if (variant.stock === null) return variant;
    const enBase = actual.variants?.find((v) => v.id === variant.id);
    return enBase?.stock == null ? variant : { ...variant, stock: enBase.stock };
  });
  return { ...draft, stock, variants };
}

/** Alta y edición: un upsert por id cubre los dos casos. */
export function useSaveProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: ProductDraft) => {
      let row = draft;
      if (draft.id !== null) {
        const { data, error } = await supabase
          .from("products")
          .select("stock, variants")
          .eq("id", draft.id)
          .maybeSingle();
        if (error) throw error;
        if (data) row = conservarStock(draft, data as StockActual);
      }
      // Un producto nuevo entra primero en el orden de la tienda, como pasaba
      // cuando se ordenaba por novedades. Al editar, `orden` no viaja en el
      // upsert y la base conserva el que tenía.
      let orden: { orden?: number } = {};
      if (draft.id === null) {
        const { data, error } = await supabase
          .from("products")
          .select("orden")
          .order("orden")
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        orden = { orden: ((data as { orden: number } | null)?.orden ?? 1) - 1 };
      }
      const { error } = await supabase
        .from("products")
        .upsert({ ...rowFromDraft(row), ...orden }, { onConflict: "id" });
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

/** Cambios rápidos desde el listado o precios. El stock no está: se mueve
 *  desde Distribución, por `useRegistrarMovimiento`, para que quede anotado. */
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
        inStock?: boolean;
        cost?: number | null;
        isBundle?: boolean;
        category?: Category;
      };
    }) => {
      const row: Record<string, unknown> = {};
      if (patch.price !== undefined) row.price = patch.price;
      if (patch.inStock !== undefined) row.in_stock = patch.inStock;
      if (patch.cost !== undefined) row.cost = patch.cost;
      if (patch.isBundle !== undefined) row.is_bundle = patch.isBundle;
      if (patch.category !== undefined) row.category = patch.category;

      const { error } = await supabase.from("products").update(row).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

/** Guarda el orden de la tienda: recibe los ids en el orden nuevo y le da a
 *  cada uno su lugar. Son pocos productos, así que va un update por fila. */
export function useReorderProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: number[]) => {
      const results = await Promise.all(
        ids.map((id, index) =>
          supabase.from("products").update({ orden: index + 1 }).eq("id", id),
        ),
      );
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;
    },
    onMutate: async (ids) => {
      // Se mueve en pantalla al toque; si falla, onError lo devuelve.
      await queryClient.cancelQueries({ queryKey: ["admin", "products"] });
      const previous = queryClient.getQueryData<AdminProduct[]>([
        "admin",
        "products",
      ]);
      if (previous) {
        const lugar = new Map(ids.map((id, index) => [id, index + 1]));
        queryClient.setQueryData<AdminProduct[]>(
          ["admin", "products"],
          previous
            .map((product) => ({
              ...product,
              orden: lugar.get(product.id) ?? product.orden,
            }))
            .sort((a, b) => a.orden - b.orden),
        );
      }
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["admin", "products"], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
