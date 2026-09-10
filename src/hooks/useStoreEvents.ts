import { useQuery } from "@tanstack/react-query";
import { previousRangeStart, type RangeId } from "../lib/admin";
import { supabase } from "../lib/supabase";
import type { StoreEvent } from "../types/admin";

type StoreEventRow = {
  created_at: string;
  kind: "add_to_cart" | "begin_checkout";
  session_id: string;
  slug: string | null;
  qty: number | null;
  value: number | null;
};

/**
 * Los eventos del embudo del rango pedido más el período anterior, con el
 * mismo criterio que `useVisits`: filas crudas, porque el embudo se cuenta por
 * sesión y un `count()` no alcanza para saber cuántas sesiones distintas
 * agregaron al carrito.
 *
 * Mismo tope de 20.000 filas y misma consecuencia: si un rango lo supera se
 * quedan las más nuevas y ese período queda corto. Son bastantes menos que las
 * visitas —hay que hacer algo para generarlos—, así que llegar al techo está
 * lejos.
 */
export function useStoreEvents(range: RangeId) {
  return useQuery({
    queryKey: ["admin", "store-events", range],
    queryFn: async (): Promise<StoreEvent[]> => {
      let query = supabase
        .from("store_events")
        .select("created_at, kind, session_id, slug, qty, value")
        .order("created_at", { ascending: false })
        .limit(20000);

      const from = previousRangeStart(range);
      if (from) query = query.gte("created_at", from.toISOString());

      const { data, error } = await query;
      if (error) throw error;

      return (data as StoreEventRow[]).map((row) => ({
        createdAt: row.created_at,
        kind: row.kind,
        sessionId: row.session_id,
        slug: row.slug,
        qty: row.qty,
        value: row.value,
      }));
    },
    staleTime: 60 * 1000,
  });
}
