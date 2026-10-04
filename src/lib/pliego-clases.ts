/** Las clases que se repiten en las páginas de Pliego. Adentro de Pliego todo
 *  es Pliego: fondo hueso, antracita, salvia como único acento (los botones),
 *  Manrope para leer e IBM Plex Mono solo para medidas y rótulos. Esquinas
 *  R10 en tarjetas y fotos, R2 en botones, como los plegados del soporte. */

// Misma grilla que el resto de la tienda: DZ pone el padding en la sección y
// el max-w-6xl (1152 px de contenido) adentro. Acá va en un solo elemento, así
// que el ancho máximo suma los 48 px de cada lado: 1152 + 96 = 1248 px.
export const contenedor = "mx-auto max-w-[78rem] px-5 sm:px-8 lg:px-12";

export const rotulo =
  "font-pliego-mono text-[11px] font-medium uppercase leading-4 tracking-[0.08em]";

export const botonPrimario =
  "inline-flex min-h-12 items-center justify-center rounded-sm bg-pliego-salvia px-6 text-[15px] font-medium text-pliego-tinta transition-colors hover:bg-[#8FA590] disabled:cursor-not-allowed disabled:opacity-60";

export const botonSecundario =
  "inline-flex min-h-12 items-center justify-center rounded-sm border border-pliego-tinta px-6 text-[15px] font-medium text-pliego-tinta transition-colors hover:bg-pliego-tinta hover:text-pliego-fondo";

export const tituloSeccion = "text-[28px] font-medium leading-[34px]";

/** El fondo de toda página de Pliego. */
export const paginaPliego =
  "bg-pliego-fondo pb-4 font-pliego text-base leading-[26px] text-pliego-tinta";

/** Las secciones a las que se salta desde la subbarra. En escritorio la
 *  subbarra queda fija debajo del header, así que el salto deja lugar para
 *  los dos (72 + 57 px). */
export const ancla = "scroll-mt-28 lg:scroll-mt-40";
