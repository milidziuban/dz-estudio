import type { ContentFormat, ContentKind } from "./admin";

export type IgTipo = "carrusel" | "reel" | "foto" | "historia";

export type IgTema =
  | "producto"
  | "combinar"
  | "uso"
  | "proceso"
  | "novedad"
  | "explicativo"
  | "cercania";

export type IgPost = {
  id: string;
  publicado: string;
  tipo: IgTipo;
  tema: IgTema | null;
  texto: string | null;
  vistas: number;
  vistasPagas: number;
  alcance: number;
  alcancePago: number;
  interacciones: number;
  interaccionesPagas: number;
  meGusta: number;
  comentarios: number;
  compartidos: number;
  guardados: number;
  clics: number;
  respuestas: number;
  seguidores: number;
  segundos: number | null;
};

export type IgDia = {
  /** YYYY-MM-DD */
  fecha: string;
  vistas: number;
  interacciones: number;
  clics: number;
  visitas: number;
  seguidores: number;
};

export type IgPublico = {
  tipo: "edad" | "sexo" | "ciudad";
  valor: string;
  parte: number;
};

/** "firme": los datos alcanzan para decirlo. "pista": apunta para ahí, pero
 *  son pocos casos. */
export type IgFuerza = "firme" | "pista";

export type IgIdea = {
  titulo: string;
  formato: ContentFormat;
  tipo: ContentKind;
  /** YYYY-MM-DD */
  fecha: string;
  /** HH:MM */
  hora: string;
  /** La primera línea del texto */
  primera: string;
  brief: string;
  porque: string;
};

/** El json de `ig_informes.contenido` */
export type IgInforme = {
  desde: string;
  hasta: string;
  perfil: {
    usuario: string;
    seguidores: number;
    seguidos: number;
    publicaciones: number;
  };
  enUnaFrase: string;
  conclusiones: {
    titulo: string;
    dato: string;
    hacer: string;
    fuerza: IgFuerza;
    /** ids de `fuentes` */
    fuentes?: string[];
  }[];
  hacer: { que: string; porque: string }[];
  noHacer: { que: string; porque: string }[];
  probar: { que: string; como: string; mirar: string }[];
  ideas: IgIdea[];
  competencia: {
    nombre: string;
    usuario: string;
    seguidores: string;
    publicaciones: number;
    hace: string[];
    tomar: string;
    dejar: string;
  }[];
  precios: { que: string; dz: string; pulpa: string; coolhouse: string }[];
  lecturaPrecios: string;
  mercado: { dato: string; fuente: string }[];
  fuentes: { id: string; titulo: string; nota: string; url: string }[];
};

export type IgDatos = {
  posts: IgPost[];
  dias: IgDia[];
  publico: IgPublico[];
  /** El último informe, con la fecha en que se leyó */
  informe: (IgInforme & { fecha: string }) | null;
};
