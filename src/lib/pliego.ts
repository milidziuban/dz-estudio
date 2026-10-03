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
 *  - "espera": las fichas se ven, pero el botón de compra es la lista de
 *    espera.
 *  - "venta": cada pieza cargada en el panel (categoría Pliego, mismo slug
 *    que en PIEZAS, con precio) se puede agregar al carrito. La que todavía
 *    no está cargada sigue mostrando la lista de espera, así que pasar a
 *    "venta" con el catálogo a medio cargar no rompe nada. */
export const PLIEGO_ETAPA: "espera" | "venta" = "espera";

/** Carga máxima confirmada con la prueba de la primera unidad (24 h con la
 *  carga centrada). Mientras sea null la página no promete ningún peso. */
export const PLIEGO_CARGA_KG: number | null = null;

/** Manrope + IBM Plex Mono. Se piden solo en las piezas de Pliego, así el
 *  resto de la tienda no baja dos fuentes que no usa. */
export const PLIEGO_FUENTES =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500&display=swap";

export const PLIEGO_PATH = "/pliego";

/** La ficha de una pieza: /pliego/bandeja. */
export function rutaPieza(slug: string): string {
  return `${PLIEGO_PATH}/${slug}`;
}

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

// ── Las piezas ─────────────────────────────────────────────────

export type PliegoFoto = {
  src: string;
  alt: string;
  /** Encuadre dentro del recorte (object-position). Las fotos provisorias
   *  reusan la del escritorio y cada ficha la centra en su pieza. */
  posicion?: string;
};

export type PliegoTipo = "soporte" | "accesorio" | "sistema";

/** Una pieza de Pliego. Lo que está acá es el contenido de su ficha; el
 *  precio y el stock salen del panel (tabla `products`, categoría Pliego,
 *  mismo slug). Si la pieza todavía no está cargada, la ficha se ve igual y
 *  el botón es la lista de espera. */
export type PliegoPieza = {
  slug: string;
  tipo: PliegoTipo;
  nombre: string;
  /** Una línea: para qué sirve. Va en las tarjetas y debajo del título. */
  bajada: string;
  /** El párrafo de la ficha. */
  texto: string;
  /** Tres usos concretos, en la ficha. */
  usos: string[];
  datos: PliegoDato[];
  /** La primera es la de las tarjetas. Son provisorias hasta la sesión de
   *  fotos: cuando la pieza tenga fotos cargadas en el panel, mandan esas. */
  fotos: PliegoFoto[];
};

const ESCRITORIO = "/pliego/soporte-24-escritorio.webp";

const ENCASTRE: PliegoDato = {
  rotulo: "Encastre",
  valor: "Cualquier ranura, sin herramientas",
};

export const SOPORTE: PliegoPieza = {
  slug: "soporte-24",
  tipo: "soporte",
  nombre: "Soporte 24",
  bajada: "Una sola pieza de acero que levanta el monitor y libera la mesa.",
  texto:
    "Chapa de acero de 1,5 mm cortada y plegada, sin tornillos ni soldaduras. Levanta el monitor y deja unos 90 mm libres debajo para guardar el teclado al terminar el día. Tiene doce ranuras: seis adelante para lo que usás todo el día y seis atrás para llevar los cables.",
  usos: [
    "El monitor más alto, la mesa libre",
    "El teclado entra debajo al terminar el día",
    "Doce ranuras para sumar accesorios cuando quieras",
  ],
  datos: datosMedidas(),
  fotos: [
    {
      src: ESCRITORIO,
      alt: "Soporte 24 en un escritorio, con el monitor encima y accesorios en sus ranuras",
    },
    {
      src: ESCRITORIO,
      alt: "Detalle del pliegue lateral del Soporte 24",
      posicion: "2% 75%",
    },
    {
      src: ESCRITORIO,
      alt: "Las ranuras del frente del Soporte 24",
      posicion: "70% 55%",
    },
  ],
};

export const ACCESORIOS: PliegoPieza[] = [
  {
    slug: "soporte-celular",
    tipo: "accesorio",
    nombre: "Soporte celular",
    bajada: "El celular queda de pie y a la vista, sin ocupar lugar en la mesa.",
    texto:
      "Un labio de acero a 75° que sostiene el celular parado, a la altura de la vista. Ves las notificaciones sin agarrarlo y la mesa queda libre.",
    usos: [
      "El celular a la vista mientras trabajás",
      "Videollamadas sin apoyarlo contra una taza",
      "Se pasa de ranura cuando lo querés del otro lado",
    ],
    datos: [
      { rotulo: "Material", valor: "Acero 1,2 mm" },
      { rotulo: "Ángulo", valor: "Labio a 75°" },
      ENCASTRE,
    ],
    fotos: [
      {
        src: "/pliego/accesorio-celular.webp",
        alt: "Soporte celular encastrado en el frente del soporte",
      },
      {
        src: ESCRITORIO,
        alt: "Celular de pie en el soporte celular, debajo del monitor",
        posicion: "55% 70%",
      },
    ],
  },
  {
    slug: "bandeja",
    tipo: "accesorio",
    nombre: "Bandeja",
    bajada:
      "Para lapiceras, cargadores y llaves: lo chico deja de andar suelto por el escritorio.",
    texto:
      "Una bandeja que cuelga del frente del soporte. Lo que siempre está a mano pero nunca en su lugar —la lapicera, el cargador, las llaves— tiene dónde quedarse.",
    usos: [
      "Lapiceras y resaltadores",
      "Cargadores y cables cortos",
      "Las llaves y lo que sacás de los bolsillos",
    ],
    datos: [{ rotulo: "Base útil", valor: "220 × 75 mm" }, ENCASTRE],
    fotos: [
      {
        src: "/pliego/accesorio-bandeja.webp",
        alt: "Bandeja colgada del soporte con una lapicera y un cable",
      },
      {
        src: ESCRITORIO,
        alt: "Bandeja en el extremo derecho del soporte",
        posicion: "90% 65%",
      },
    ],
  },
  {
    slug: "porta-auriculares",
    tipo: "accesorio",
    nombre: "Porta auriculares",
    bajada:
      "Los auriculares cuelgan al costado y la vincha apoya sobre una cuna protegida.",
    texto:
      "Un gancho que cuelga del borde del soporte. La vincha apoya sobre una cuna de 38 mm con protección de EVA, y los auriculares quedan al costado en vez de arriba de la mesa.",
    usos: [
      "Los auriculares siempre en el mismo lugar",
      "La cuna con EVA cuida la vincha",
      "A la izquierda o a la derecha, según de qué lado los agarres",
    ],
    datos: [
      { rotulo: "Cuna", valor: "38 mm" },
      { rotulo: "Protección", valor: "EVA" },
      ENCASTRE,
    ],
    fotos: [
      {
        src: "/pliego/accesorio-auriculares.webp",
        alt: "Auriculares colgados del porta auriculares",
      },
      {
        src: ESCRITORIO,
        alt: "Auriculares colgados del costado izquierdo del soporte",
        posicion: "15% 85%",
      },
    ],
  },
  {
    slug: "panel-de-flujo",
    tipo: "accesorio",
    nombre: "Panel de flujo",
    bajada: "Una pizarra para la lista del día, con insertos que se borran en seco.",
    texto:
      "Un panel para tener la lista del día a la vista, delante del monitor. Trae dos insertos intercambiables que se escriben con fibra y se borran en seco, con un paño o un borrador.",
    usos: [
      "La lista del día, siempre a la vista",
      "Dos insertos: uno para hoy y otro para lo que sigue",
      "Se borra en seco, sin productos",
    ],
    datos: [
      { rotulo: "Panel", valor: "210 × 140 mm" },
      { rotulo: "Insertos", valor: "2 de 110 × 110 mm" },
      ENCASTRE,
    ],
    fotos: [
      {
        src: "/pliego/accesorio-panel.webp",
        alt: "Panel de flujo con una lista escrita y dos insertos, blanco y salvia",
      },
      {
        src: ESCRITORIO,
        alt: "Panel de flujo delante del teclado, con una lista escrita",
        posicion: "55% 100%",
      },
    ],
  },
  {
    slug: "guia-de-cables",
    tipo: "accesorio",
    nombre: "Guía de cables",
    bajada:
      "Lleva el cable del monitor o del cargador por detrás, sin que cuelgue a la vista.",
    texto:
      "Un canal que encastra en las ranuras de atrás y lleva los cables por detrás del soporte. El del monitor, el del cargador y el de la lámpara dejan de colgar por delante.",
    usos: [
      "El cable del monitor, por detrás",
      "El cargador a mano, sin que se caiga al piso",
      "Con dos, un recorrido de punta a punta",
    ],
    datos: [{ rotulo: "Canal", valor: "18 × 30 mm" }, ENCASTRE],
    fotos: [
      {
        src: "/pliego/accesorio-cables.webp",
        alt: "Cable pasando por la guía de cables en el borde del soporte",
      },
    ],
  },
];

/** Lo que trae el Sistema completo (cantidades de la lista de materiales).
 *  El slug sirve para sumar lo que saldría comprar todo por separado. */
export const SISTEMA_COMPLETO: { slug: string; nombre: string; cantidad: number }[] = [
  { slug: "soporte-24", nombre: "Soporte 24", cantidad: 1 },
  { slug: "soporte-celular", nombre: "Soporte celular", cantidad: 1 },
  { slug: "bandeja", nombre: "Bandeja", cantidad: 1 },
  { slug: "porta-auriculares", nombre: "Porta auriculares", cantidad: 1 },
  { slug: "panel-de-flujo", nombre: "Panel de flujo con 2 insertos", cantidad: 1 },
  { slug: "guia-de-cables", nombre: "2 guías de cables", cantidad: 2 },
];

export const SISTEMA: PliegoPieza = {
  slug: "sistema-completo",
  tipo: "sistema",
  nombre: "Sistema completo",
  bajada: "El Soporte 24 con sus cinco accesorios, en una sola caja.",
  texto:
    "Todo Pliego de una vez: el soporte, los cuatro accesorios del frente y dos guías de cables para atrás. Lo armás en un par de minutos y después lo vas acomodando a tu manera.",
  usos: [
    "El escritorio resuelto en una sola compra",
    "Sale menos que las piezas por separado",
    "Una caja, un envío",
  ],
  datos: [
    { rotulo: "Piezas", valor: "7" },
    { rotulo: "Soporte", valor: "596,9 × 228,6 × 114,3 mm" },
    { rotulo: "Acabado", valor: "Pintura en polvo RAL 7021" },
  ],
  fotos: [
    {
      src: ESCRITORIO,
      alt: "El Sistema completo armado: soporte, celular, bandeja, auriculares y panel",
    },
    ...ACCESORIOS.map((a) => a.fotos[0]),
  ],
};

/** Todas las piezas, en el orden de la página. */
export const PIEZAS: PliegoPieza[] = [SOPORTE, ...ACCESORIOS, SISTEMA];

export function piezaPorSlug(slug: string | undefined): PliegoPieza | undefined {
  return PIEZAS.find((p) => p.slug === slug);
}
