import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { StockMotivo, StockMovimiento } from "../types/admin";

type StockMovimientoRow = {
  id: number;
  created_at: string;
  product_id: number | null;
  slug: string;
  variant_id: string | null;
  delta: number;
  saldo: number;
  motivo: StockMotivo;
  order_id: string | null;
  nota: string | null;
  autor: string | null;
};

function mapMovimiento(row: StockMovimientoRow): StockMovimiento {
  return {
    id: row.id,
    createdAt: row.created_at,
    productId: row.product_id,
    slug: row.slug,
    variantId: row.variant_id,
    delta: row.delta,
    saldo: row.saldo,
    motivo: row.motivo,
    orderId: row.order_id,
    nota: row.nota,
    autor: row.autor,
  };
}

const KEY = ["admin", "stock-movimientos"];

/** El libro entero, del más nuevo al más viejo. Son unas pocas filas por
 *  semana —seis productos, una tanda de producción cada tanto—, así que no
 *  vale la pena paginar: el historial por línea y el resumen del mes los
 *  recorta la pantalla. */
export function useStockMovimientos() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<StockMovimiento[]> => {
      const { data, error } = await supabase
        .from("stock_movimientos")
        .select("*")
        .order("id", { ascending: false });
      if (error) throw error;
      return (data as StockMovimientoRow[]).map(mapMovimiento);
    },
    staleTime: 60 * 1000,
  });
}

export type MovimientoInput = {
  slug: string;
  variantId: string | null;
  /** Con signo: positivo entra, negativo sale. */
  delta: number;
  motivo: StockMotivo;
  nota?: string;
};

/** La única puerta para mover stock desde el panel: la función
 *  `registrar_movimiento_stock` de Postgres anota el movimiento y actualiza
 *  el producto en la misma transacción. Devuelve el saldo que quedó. */
export function useRegistrarMovimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: MovimientoInput): Promise<number> => {
      const { data, error } = await supabase.rpc("registrar_movimiento_stock", {
        p_slug: input.slug,
        p_variant_id: input.variantId,
        p_delta: input.delta,
        p_motivo: input.motivo,
        p_nota: input.nota?.trim() || null,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      // La tienda usa otra query key: también hay que refrescarla
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
