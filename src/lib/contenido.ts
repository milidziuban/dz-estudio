import { dayKey } from "./admin";
import type {
  ContentChannel,
  ContentFormat,
  ContentKind,
  ContentPost,
  ContentStatus,
} from "../types/admin";

// ── Etiquetas ─────────────────────────────────────────────────

export const KIND_LABEL: Record<ContentKind, string> = {
  producto: "Producto",
  proceso: "Proceso",
  uso: "Uso",
  cercania: "Cercanía",
  cliente: "Cliente",
  promo: "Promo",
  otro: "Preparación",
};

export const FORMAT_LABEL: Record<ContentFormat, string> = {
  feed: "Feed",
  carrusel: "Carrusel",
  reel: "Reel",
  historia: "Historia",
  tarea: "Tarea",
};

export const CHANNEL_LABEL: Record<ContentChannel, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  ambos: "Instagram + Facebook",
};

export const STATUS_LABEL: Record<ContentStatus, string> = {
  idea: "Idea",
  foto: "Foto lista",
  listo: "Listo para subir",
  publicado: "Publicado",
  pospuesto: "Pospuesto",
};

/** El color del calendario lo pone el estado, no el tipo: lo que se mira de
 *  reojo es qué falta, no de qué habla la pieza. Tres colores y dos grises,
 *  para no convertir la grilla en un arcoíris. */
export const STATUS_DOT: Record<ContentStatus, string> = {
  idea: "bg-ink/25",
  foto: "bg-celeste",
  listo: "bg-verde",
  publicado: "bg-ink",
  pospuesto: "bg-orange",
};

/** La mezcla semanal recomendada en `06 Contenido/Reglas de contenido.md`. */
export const MEZCLA_SEMANAL: { kind: ContentKind; cada: number }[] = [
  { kind: "producto", cada: 2 },
  { kind: "proceso", cada: 1 },
  { kind: "uso", cada: 1 },
  { kind: "cercania", cada: 1 },
];

/** Los estados en los que la pieza todavía no salió. */
export function pendiente(post: ContentPost): boolean {
  return post.status !== "publicado" && post.status !== "pospuesto";
}

// ── Fecha y hora ──────────────────────────────────────────────

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const DIAS_CORTOS = DIAS;

/** Los inputs `date` y `time` piden hora local; la base guarda ISO. */
export function localParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return { date: dayKey(d), time: `${hh}:${mm}` };
}

export function isoFromParts(date: string, time: string): string {
  // Sin zona: el navegador lo lee como hora local, que es la que escribió ella.
  return new Date(`${date}T${time || "00:00"}`).toISOString();
}

/** "19:30" — la hora sola, que es lo que se lee en la grilla. */
export function formatHora(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

/** "Jueves, 10 de septiembre" — el encabezado de cada día en la agenda. */
export function formatDiaLargo(date: Date): string {
  const texto = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "Septiembre 2026". Sin el "de" que mete es-AR: es un encabezado de
 *  calendario, no una fecha en una oración. */
export function formatMes(year: number, month: number): string {
  const texto = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  })
    .format(new Date(year, month, 1))
    .replace(" de ", " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Las celdas de la grilla del mes, arrancando en lunes. Incluye los días de
 *  los meses vecinos que completan la primera y la última semana, y ninguno
 *  más: un mes que entra en cinco semanas no dibuja una sexta fila vacía. */
export function monthGrid(year: number, month: number): Date[] {
  const primero = new Date(year, month, 1);
  // getDay(): domingo = 0. La semana acá arranca el lunes.
  const offset = (primero.getDay() + 6) % 7;
  const dias = new Date(year, month + 1, 0).getDate();
  const celdas = Math.ceil((offset + dias) / 7) * 7;
  const inicio = new Date(year, month, 1 - offset);
  return Array.from({ length: celdas }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    return d;
  });
}

export function esHoy(date: Date): boolean {
  return dayKey(date) === dayKey(new Date());
}

/** Las piezas de un mes, ordenadas por día y hora. */
export function postsDelMes(
  posts: ContentPost[],
  year: number,
  month: number,
): ContentPost[] {
  return posts
    .filter((post) => {
      const d = new Date(post.scheduledAt);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
}

/** Agrupadas por día (clave YYYY-MM-DD local), ya ordenadas por hora. */
export function porDia(posts: ContentPost[]): Map<string, ContentPost[]> {
  const mapa = new Map<string, ContentPost[]>();
  for (const post of posts) {
    const key = dayKey(new Date(post.scheduledAt));
    const lista = mapa.get(key);
    if (lista) lista.push(post);
    else mapa.set(key, [post]);
  }
  for (const lista of mapa.values()) {
    lista.sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
  }
  return mapa;
}
