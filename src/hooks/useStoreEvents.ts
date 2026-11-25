import { useQuery } from "@tanstack/react-query";
import { previousRangeStart, type RangeId } from "../lib/admin";
import { leerTodo } from "../lib/leer-todo";
import { supabase } from "../lib/supabase";
import type { StoreEvent } from "../types/admin";

type StoreEventRow = {
  created_at: string;
  kind: StoreEvent["kind"];
  session_id: string;
  slug: string | null;
  qty: number | null;
  value: number | null;
  path: string | null;
  detail: string | null;
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
 * lejos —aunque desde el 30/10 la tabla guarda también scroll y fichas vistas,
 * que son bastantes más—.
 */
export function useStoreEvents(range: RangeId) {
  return useQuery({
    queryKey: ["admin", "store-events", range],
    queryFn: async (): Promise<StoreEvent[]> => {
      const from = previousRangeStart(range);

      const filas = await leerTodo<StoreEventRow>((desde, hasta) => {
        let query = supabase
          .from("store_events")
          .select(
            "created_at, kind, session_id, slug, qty, value, path, detail",
          )
          .order("created_at", { ascending: false })
          // Dos filas del mismo instante tienen que salir siempre en el mismo
          // orden, o una página las repite y la otra las saltea
          .order("id", { ascending: false })
          .range(desde, hasta);
        if (from) query = query.gte("created_at", from.toISOString());
        return query;
      });

      return filas.map((row) => ({
        createdAt: row.created_at,
        kind: row.kind,
        sessionId: row.session_id,
        slug: row.slug,
        qty: row.qty,
        value: row.value,
        path: row.path,
        detail: row.detail,
      }));
    },
    staleTime: 60 * 1000,
  });
}
