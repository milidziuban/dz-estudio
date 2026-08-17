import { useQuery } from "@tanstack/react-query";
import { previousRangeStart, type RangeId } from "../lib/admin";
import { supabase } from "../lib/supabase";
import type { PageView } from "../types/admin";

type PageViewRow = {
  created_at: string;
  path: string;
  referrer: string | null;
  session_id: string;
  is_new_session: boolean;
};

/**
 * Visitas del rango pedido más el período anterior, que es lo que necesitan
 * las tarjetas para comparar. Trae filas crudas porque el dashboard arma una
 * serie por día: un count() no alcanza.
 *
 * El tope de 20.000 filas es el techo de lo que tiene sentido traer al
 * navegador. Si un rango lo supera, se quedan las más nuevas y los totales de
 * ese período quedan cortos: a partir de ahí hay que agregar por día en la base
 * (una vista materializada o un rpc) en vez de contar acá.
 */
export function useVisits(range: RangeId) {
  return useQuery({
    queryKey: ["admin", "page-views", range],
    queryFn: async (): Promise<PageView[]> => {
      let query = supabase
        .from("page_views")
        .select("created_at, path, referrer, session_id, is_new_session")
        .order("created_at", { ascending: false })
        .limit(20000);

      const from = previousRangeStart(range);
      if (from) query = query.gte("created_at", from.toISOString());

      const { data, error } = await query;
      if (error) throw error;

      return (data as PageViewRow[]).map((row) => ({
        createdAt: row.created_at,
        path: row.path,
        referrer: row.referrer,
        sessionId: row.session_id,
        isNewSession: row.is_new_session,
      }));
    },
    staleTime: 60 * 1000,
  });
}
