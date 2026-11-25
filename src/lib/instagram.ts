import type { IgDia, IgPost, IgTema, IgTipo } from "../types/instagram";

export const IG_TIPO_LABEL: Record<IgTipo, string> = {
  carrusel: "Carrusel",
  reel: "Reel",
  foto: "Foto",
  historia: "Historia",
};

export const IG_TEMA_LABEL: Record<IgTema, string> = {
  producto: "Producto",
  combinar: "Elegir o combinar",
  uso: "En uso",
  proceso: "Proceso",
  novedad: "Novedad",
  explicativo: "Explicación",
  cercania: "Cercanía",
};

/** Días que tarda una publicación en juntar casi todo lo que va a juntar. Las
 *  más nuevas se muestran pero no entran en los promedios. */
const DIAS_MADURA = 3;

/** Personas a las que llegó sola, sin la pauta. Es una resta: si alguien la
 *  vio de las dos maneras, queda del lado de la pauta. */
export function alcanceSinPauta(post: IgPost): number {
  return Math.max(0, post.alcance - post.alcancePago);
}

/** De cada 100 que la vieron sin pauta, cuántas hicieron algo. */
export function tasaSinPauta(post: IgPost): number | null {
  const alcance = alcanceSinPauta(post);
  if (alcance === 0) return null;
  return (
    (Math.max(0, post.interacciones - post.interaccionesPagas) / alcance) * 100
  );
}

/** La del medio. Con veinte publicaciones, un promedio lo mueve una sola. */
export function mediana(valores: number[]): number {
  if (valores.length === 0) return 0;
  const orden = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  return orden.length % 2
    ? orden[medio]
    : (orden[medio - 1] + orden[medio]) / 2;
}

export function feedDe(posts: IgPost[]): IgPost[] {
  return posts.filter((p) => p.tipo !== "historia");
}

/** Las que ya juntaron lo que iban a juntar cuando se hizo la lectura. */
export function maduras(posts: IgPost[], leido: string): IgPost[] {
  const corte = new Date(`${leido}T23:59:59`);
  corte.setDate(corte.getDate() - DIAS_MADURA);
  return posts.filter((p) => new Date(p.publicado) <= corte);
}

export type GrupoIg = {
  clave: string;
  cantidad: number;
  alcance: number;
  tasa: number;
  guardados: number;
  compartidos: number;
};

export function agruparPosts(
  posts: IgPost[],
  clave: (p: IgPost) => string | null,
): GrupoIg[] {
  const grupos = new Map<string, IgPost[]>();
  for (const post of posts) {
    const k = clave(post);
    if (!k) continue;
    grupos.set(k, [...(grupos.get(k) ?? []), post]);
  }
  return [...grupos.entries()]
    .map(([k, lista]) => ({
      clave: k,
      cantidad: lista.length,
      alcance: mediana(lista.map(alcanceSinPauta)),
      tasa: mediana(
        lista.map(tasaSinPauta).filter((t): t is number => t !== null),
      ),
      guardados: lista.reduce((n, p) => n + p.guardados, 0),
      compartidos: lista.reduce((n, p) => n + p.compartidos, 0),
    }))
    .sort((a, b) => b.alcance - a.alcance);
}

/** Las historias con casi nadie adentro son reenvíos o pruebas. */
export function espectadoresDeHistorias(posts: IgPost[]): number {
  return mediana(
    posts
      .filter((p) => p.tipo === "historia" && p.vistas > 20)
      .map((p) => p.alcance),
  );
}

export function sumarIgDias(dias: IgDia[]): Omit<IgDia, "fecha"> {
  return dias.reduce(
    (t, d) => ({
      vistas: t.vistas + d.vistas,
      interacciones: t.interacciones + d.interacciones,
      clics: t.clics + d.clics,
      visitas: t.visitas + d.visitas,
      seguidores: t.seguidores + d.seguidores,
    }),
    { vistas: 0, interacciones: 0, clics: 0, visitas: 0, seguidores: 0 },
  );
}
