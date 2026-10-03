/** Pliego, la línea de escritorio de DZ Estudio.
 *
 *  Vive dentro de la tienda (mismo header, carrito y checkout) pero con su
 *  propia identidad: paleta "Acero y salvia", Manrope e IBM Plex Mono, y su
 *  logo. Las reglas están en el sistema de marca de Pliego. Lo que no cambia
 *  nunca —el marco de la tienda— sigue siendo DZ.
 *
 *  Las medidas salen del plano de fabricación (Soporte 24, opción 1, rev. A).
 *  Si el plano cambia después de la primera muestra, cambiarlas acá. */

/** Etapa del lanzamiento.
 *  - "espera": todavía no hay unidades; los botones llevan a la lista de espera.
 *  - "venta": los botones llevan a las fichas de producto. Antes de pasar a
 *    "venta" tienen que existir en el panel los productos con los slugs de
 *    abajo (y su foto y su precio). */
export const PLIEGO_ETAPA: "espera" | "venta" = "espera";

/** Slugs de las fichas, para cuando la etapa pase a "venta". */
export const PLIEGO_SLUGS = {
  soporte: "soporte-24",
  sistema: "sistema-completo",
} as const;

/** Carga máxima confirmada con la prueba de la primera unidad (24 h con la
 *  carga centrada). Mientras sea null la página no promete ningún peso. */
export const PLIEGO_CARGA_KG: number | null = null;

/** Manrope + IBM Plex Mono. Se piden solo en las piezas de Pliego, así el
 *  resto de la tienda no baja dos fuentes que no usa. */
export const PLIEGO_FUENTES =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500&display=swap";

export const PLIEGO_PATH = "/pliego";

/** Las páginas de Pliego van sin la marquesina de la tienda: sus promos son
 *  de los textiles y el ruido visual no va con la calma que vende Pliego. */
export function esRutaPliego(pathname: string): boolean {
  return pathname === PLIEGO_PATH || pathname.startsWith(`${PLIEGO_PATH}/`);
}

export type PliegoDato = { rotulo: string; valor: string };

/** Los cuatro datos de la portada. */
export const DATOS_PORTADA: PliegoDato[] = [
  { rotulo: "Medidas", valor: "596,9 × 228,6 × 114,3 mm" },
  { rotulo: "Cuerpo", valor: "Acero 1,5 mm, una pieza" },
  { rotulo: "Acabado", valor: "Pintura en polvo RAL 7021" },
  { rotulo: "Ranuras", valor: "6 adelante + 6 atrás" },
];

/** La ficha técnica completa, al lado del plano. */
export function datosMedidas(): PliegoDato[] {
  const datos: PliegoDato[] = [
    { rotulo: "Largo", valor: "596,9 mm" },
    { rotulo: "Profundidad", valor: "228,6 mm" },
    { rotulo: "Altura", valor: "114,3 mm" },
    { rotulo: "Espacio libre debajo", valor: "≈ 90,5 mm" },
    { rotulo: "Material", valor: "Acero laminado en frío 1,5 mm" },
    { rotulo: "Acabado", valor: "Pintura en polvo RAL 7021, mate" },
    { rotulo: "Ranuras", valor: "12 × 68 × 5,2 mm" },
  ];
  if (PLIEGO_CARGA_KG !== null) {
    datos.push({ rotulo: "Carga", valor: `${PLIEGO_CARGA_KG} kg centrados` });
  }
  return datos;
}

export type PliegoAccesorio = {
  nombre: string;
  texto: string;
  dato: string;
  imagen: string;
  alt: string;
};

export const ACCESORIOS: PliegoAccesorio[] = [
  {
    nombre: "Soporte celular",
    texto: "El celular queda de pie y a la vista, sin ocupar lugar en la mesa.",
    dato: "Acero 1,2 mm · labio a 75°",
    imagen: "/pliego/accesorio-celular.webp",
    alt: "Soporte celular encastrado en el frente del soporte",
  },
  {
    nombre: "Bandeja",
    texto:
      "Para lapiceras, cargadores y llaves: lo chico deja de andar suelto por el escritorio.",
    dato: "Base útil 220 × 75 mm",
    imagen: "/pliego/accesorio-bandeja.webp",
    alt: "Bandeja colgada del soporte con una lapicera y un cable",
  },
  {
    nombre: "Porta auriculares",
    texto:
      "Los auriculares cuelgan al costado y la vincha apoya sobre una cuna protegida.",
    dato: "Cuna 38 mm · protección EVA",
    imagen: "/pliego/accesorio-auriculares.webp",
    alt: "Auriculares colgados del porta auriculares",
  },
  {
    nombre: "Panel de flujo",
    texto: "Una pizarra para la lista del día, con insertos que se borran en seco.",
    dato: "210 × 140 mm · insertos 110 × 110 mm",
    imagen: "/pliego/accesorio-panel.webp",
    alt: "Panel de flujo con una lista escrita y dos insertos, blanco y salvia",
  },
  {
    nombre: "Guía de cables",
    texto:
      "Lleva el cable del monitor o del cargador por detrás, sin que cuelgue a la vista.",
    dato: "Canal 18 × 30 mm",
    imagen: "/pliego/accesorio-cables.webp",
    alt: "Cable pasando por la guía de cables en el borde del soporte",
  },
];

/** Lo que trae el Sistema completo (cantidades de la lista de materiales). */
export const SISTEMA_COMPLETO = [
  "Soporte 24",
  "Soporte celular",
  "Bandeja",
  "Porta auriculares",
  "Panel de flujo con 2 insertos",
  "2 guías de cables",
];
