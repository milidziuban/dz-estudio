import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type {
  IgDatos,
  IgDia,
  IgInforme,
  IgPublico,
  IgTema,
  IgTipo,
} from "../types/instagram";

type PostRow = {
  id: string;
  publicado: string;
  tipo: IgTipo;
  tema: IgTema | null;
  texto: string | null;
  vistas: number;
  vistas_pagas: number;
  alcance: number;
  alcance_pago: number;
  interacciones: number;
  interacciones_pagas: number;
  me_gusta: number;
  comentarios: number;
  compartidos: number;
  guardados: number;
  clics: number;
  respuestas: number;
  seguidores: number;
  segundos: number | null;
};

/** La última lectura de Instagram y el informe que salió de ella. Se carga a
 *  mano: acá no hay conexión con Instagram. */
export function useInstagram() {
  return useQuery({
    queryKey: ["admin", "instagram"],
    queryFn: async (): Promise<IgDatos> => {
      const [posts, dias, publico, informe] = await Promise.all([
        supabase
          .from("ig_posts")
          .select("*")
          .order("publicado", { ascending: false }),
        supabase
          .from("ig_diario")
          .select("fecha, vistas, interacciones, clics, visitas, seguidores")
          .order("fecha", { ascending: true }),
        supabase.from("ig_publico").select("tipo, valor, parte"),
        supabase
          .from("ig_informes")
          .select("fecha, contenido")
          .order("fecha", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      for (const r of [posts, dias, publico, informe]) {
        if (r.error) throw r.error;
      }

      const ultimo = informe.data as {
        fecha: string;
        contenido: IgInforme;
      } | null;

      return {
        posts: (posts.data as PostRow[]).map((p) => ({
          id: p.id,
          publicado: p.publicado,
          tipo: p.tipo,
          tema: p.tema,
          texto: p.texto,
          vistas: p.vistas,
          vistasPagas: p.vistas_pagas,
          alcance: p.alcance,
          alcancePago: p.alcance_pago,
          interacciones: p.interacciones,
          interaccionesPagas: p.interacciones_pagas,
          meGusta: p.me_gusta,
          comentarios: p.comentarios,
          compartidos: p.compartidos,
          guardados: p.guardados,
          clics: p.clics,
          respuestas: p.respuestas,
          seguidores: p.seguidores,
          segundos: p.segundos,
        })),
        dias: dias.data as IgDia[],
        publico: publico.data as IgPublico[],
        informe: ultimo && { ...ultimo.contenido, fecha: ultimo.fecha },
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
