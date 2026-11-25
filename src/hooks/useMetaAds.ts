import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { leerTodo } from "../lib/leer-todo";
import { supabase } from "../lib/supabase";
import type {
  DestinoCampana,
  EstadoCampana,
  MetaAds,
  MetaPublico,
} from "../types/meta";

type CampanaRow = {
  id: string;
  nombre: string;
  estado: EstadoCampana;
  destino: DestinoCampana;
  inicio: string | null;
  fin: string | null;
  presupuesto: number | null;
  alcance: number;
  link: string | null;
};

type DiaRow = {
  campana_id: string;
  fecha: string;
  gasto: number;
  impresiones: number;
  clics: number;
  visitas: number;
  interacciones: number;
  reacciones: number;
  guardados: number;
  carritos: number;
  checkouts: number;
  compras: number;
  valor_compras: number;
};

type SyncRow = {
  actualizado: string;
  origen: "api" | "a-mano";
  alcance_total: number | null;
  error: string | null;
};

const CLAVE = ["admin", "meta-ads"];

/** Lo último que se guardó de Meta. No habla con Meta: lee la copia. */
export function useMetaAds() {
  return useQuery({
    queryKey: CLAVE,
    queryFn: async (): Promise<MetaAds> => {
      const [campanas, dias, publico, sync] = await Promise.all([
        supabase
          .from("meta_campanas")
          .select(
            "id, nombre, estado, destino, inicio, fin, presupuesto, alcance, link",
          )
          .order("inicio", { ascending: false, nullsFirst: false }),
        leerTodo<DiaRow>((desde, hasta) =>
          supabase
            .from("meta_diario")
            .select(
              "campana_id, fecha, gasto, impresiones, clics, visitas, interacciones, reacciones, guardados, carritos, checkouts, compras, valor_compras",
            )
            .order("fecha", { ascending: true })
            .order("campana_id", { ascending: true })
            .range(desde, hasta),
        ),
        supabase
          .from("meta_publico")
          .select("tipo, valor, gasto, impresiones, clics")
          .order("gasto", { ascending: false }),
        supabase
          .from("meta_sync")
          .select("actualizado, origen, alcance_total, error")
          .maybeSingle(),
      ]);
      if (campanas.error) throw campanas.error;
      if (publico.error) throw publico.error;
      if (sync.error) throw sync.error;

      const estado = sync.data as SyncRow | null;
      return {
        campanas: campanas.data as CampanaRow[],
        dias: dias.map((d) => ({
          campanaId: d.campana_id,
          fecha: d.fecha,
          gasto: d.gasto,
          impresiones: d.impresiones,
          clics: d.clics,
          visitas: d.visitas,
          interacciones: d.interacciones,
          reacciones: d.reacciones,
          guardados: d.guardados,
          carritos: d.carritos,
          checkouts: d.checkouts,
          compras: d.compras,
          valorCompras: d.valor_compras,
        })),
        publico: publico.data as MetaPublico[],
        sync: estado && {
          actualizado: estado.actualizado,
          origen: estado.origen,
          alcanceTotal: estado.alcance_total,
          error: estado.error,
        },
      };
    },
    staleTime: 60 * 1000,
  });
}

type RespuestaSync = {
  /** false: falta el token de Meta en los secretos */
  conectado: boolean;
  actualizado?: boolean;
  error?: string;
};

/** Le pide a Meta los números de hoy y después relee la copia. Se dispara sola
 *  al abrir la pantalla; la función no vuelve a preguntar si lo que hay tiene
 *  menos de media hora, salvo con `forzar`. */
export function useActualizarMeta() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (forzar: boolean): Promise<RespuestaSync> => {
      const { data, error } = await supabase.functions.invoke("meta-ads", {
        body: { forzar },
      });
      if (error) throw error;
      return data as RespuestaSync;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  });

  const yaPidio = useRef(false);
  const { mutate } = mutation;
  useEffect(() => {
    if (yaPidio.current) return;
    yaPidio.current = true;
    mutate(false);
  }, [mutate]);

  return mutation;
}
