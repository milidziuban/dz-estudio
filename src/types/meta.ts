/** Los anuncios de Meta, ya pasados en limpio por la función `meta-ads`. */

export type EstadoCampana =
  | "activa"
  | "en_revision"
  | "completada"
  | "pausada"
  | "con_problema";

/** A dónde manda el botón del anuncio */
export type DestinoCampana = "web" | "perfil" | "otro";

export type MetaCampana = {
  /** El id de Meta. Es también el `utm_campaign` de las visitas que trae. */
  id: string;
  nombre: string;
  estado: EstadoCampana;
  destino: DestinoCampana;
  inicio: string | null;
  fin: string | null;
  presupuesto: number | null;
  /** Personas distintas, en toda la vida de la campaña */
  alcance: number;
  link: string | null;
};

export type MetaDia = {
  campanaId: string;
  /** YYYY-MM-DD */
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
  valorCompras: number;
};

export type TipoPublico = "edad" | "sexo" | "provincia" | "lugar";

export type MetaPublico = {
  tipo: TipoPublico;
  valor: string;
  gasto: number;
  impresiones: number;
  clics: number;
};

export type MetaSync = {
  actualizado: string;
  origen: "api" | "a-mano";
  alcanceTotal: number | null;
  error: string | null;
};

export type MetaAds = {
  campanas: MetaCampana[];
  dias: MetaDia[];
  publico: MetaPublico[];
  sync: MetaSync | null;
};
