import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { StoreEvent } from "../types/admin";

/** Cuánto para atrás se mira. Media hora es lo que dura una visita larga:
 *  más corto parece que no hay nadie, más largo deja de ser "ahora". */
export const VENTANA_MINUTOS = 30;

export type AhoraMismo = {
  /** Sesiones distintas con actividad en la ventana */
  sesiones: number;
  vistas: number;
  /** Qué se está mirando, de más a menos */
  paginas: { path: string; sesiones: number }[];
  /** Lo último que hizo alguien, lo más nuevo primero */
  eventos: StoreEvent[];
  /** Momento del último movimiento; null si no hubo ninguno */
  ultimo: string | null;
};

/**
 * Lo que está pasando en la tienda en este momento.
 *
 * El resto del panel mira períodos cerrados: sirve para entender la semana,
 * no para mirar un lanzamiento en vivo. Esta consulta es corta a propósito
 * —media hora— y se refresca sola, así que la pantalla se puede dejar abierta
 * mientras entra el tráfico de un posteo.
 *
 * Se cuenta por sesión: una persona que abre seis fichas es una sola,
 * no seis.
 */
export function useAhoraMismo() {
  return useQuery({
    queryKey: ["admin", "ahora-mismo"],
    queryFn: async (): Promise<AhoraMismo> => {
      const desde = new Date(
        Date.now() - VENTANA_MINUTOS * 60 * 1000,
      ).toISOString();

      const [vistas, eventos] = await Promise.all([
        supabase
          .from("page_views")
          .select("created_at, path, session_id")
          .gte("created_at", desde)
          .order("created_at", { ascending: false })
          .limit(2000),
        supabase
          .from("store_events")
          .select("created_at, kind, session_id, slug, qty, value")
          .gte("created_at", desde)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      if (vistas.error) throw vistas.error;
      if (eventos.error) throw eventos.error;

      const filas = (vistas.data ?? []) as {
        created_at: string;
        path: string;
        session_id: string;
      }[];

      // Sesiones por página, no vistas: el número que se quiere leer es
      // "cuánta gente está en la ficha del rosa", no cuántas veces se recargó.
      const porPagina = new Map<string, Set<string>>();
      for (const fila of filas) {
        const set = porPagina.get(fila.path) ?? new Set<string>();
        set.add(fila.session_id);
        porPagina.set(fila.path, set);
      }

      const eventosMapeados: StoreEvent[] = (
        (eventos.data ?? []) as {
          created_at: string;
          kind: StoreEvent["kind"];
          session_id: string;
          slug: string | null;
          qty: number | null;
          value: number | null;
        }[]
      ).map((row) => ({
        createdAt: row.created_at,
        kind: row.kind,
        sessionId: row.session_id,
        slug: row.slug,
        qty: row.qty,
        value: row.value,
      }));

      return {
        sesiones: new Set(filas.map((fila) => fila.session_id)).size,
        vistas: filas.length,
        paginas: [...porPagina.entries()]
          .map(([path, sesiones]) => ({ path, sesiones: sesiones.size }))
          .sort((a, b) => b.sesiones - a.sesiones)
          .slice(0, 6),
        eventos: eventosMapeados.slice(0, 8),
        ultimo: filas[0]?.created_at ?? eventosMapeados[0]?.createdAt ?? null,
      };
    },
    // La pantalla se deja abierta mirando entrar el tráfico: se refresca sola
    // y también al volver a la pestaña.
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}
