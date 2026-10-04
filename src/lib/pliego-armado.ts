/** El armador de /pliego: qué accesorio va en qué ranura del Soporte 24.
 *
 *  Las ranuras salen del plano (lib/pliego.ts y PliegoPlano): seis en el labio
 *  de adelante y seis en el pliegue de atrás, cada 88 mm. Cada ranura recibe
 *  la lengüeta de un solo accesorio. Además, lo que cuelga ocupa más ancho
 *  que la ranura: dos piezas de la misma capa no pueden pisarse. Por eso la
 *  bandeja (220 mm) bloquea las de al lado, pero el celular, que sube por
 *  delante del labio, convive con la bandeja, que cuelga por debajo. */

export const RANURAS = 6;

/** Centro de cada ranura en mm, medido desde el centro del soporte. Las de
 *  atrás están en las mismas posiciones. */
export const RANURA_X = Array.from({ length: RANURAS }, (_, i) => -220 + i * 88);

export type ArmadoCara = "frente" | "atras";
type Capa = "arriba" | "abajo" | "atras";

export type ArmadoSlug =
  | "soporte-celular"
  | "bandeja"
  | "porta-auriculares"
  | "panel-de-flujo"
  | "guia-de-cables";

type Regla = {
  slug: ArmadoSlug;
  cara: ArmadoCara;
  capa: Capa;
  /** Ancho total de lo que cuelga, en mm. */
  ancho: number;
  /** Ranuras donde puede ir, en el orden en que se prueban al sumarla. */
  ranuras: number[];
  /** Si se puede poner más de una (las guías de cables). */
  varias?: boolean;
};

export const REGLAS: Record<ArmadoSlug, Regla> = {
  "soporte-celular": {
    slug: "soporte-celular",
    cara: "frente",
    capa: "arriba",
    ancho: 76,
    ranuras: [3, 2, 4, 1, 5, 0],
  },
  bandeja: {
    slug: "bandeja",
    cara: "frente",
    capa: "abajo",
    ancho: 220,
    // En las puntas se pasaría de la pata.
    ranuras: [4, 1, 3, 2],
  },
  "porta-auriculares": {
    slug: "porta-auriculares",
    cara: "frente",
    capa: "abajo",
    ancho: 140,
    // Al costado: a la izquierda o a la derecha.
    ranuras: [0, 5],
  },
  "panel-de-flujo": {
    slug: "panel-de-flujo",
    cara: "frente",
    capa: "arriba",
    ancho: 210,
    ranuras: [1, 2, 3, 4],
  },
  "guia-de-cables": {
    slug: "guia-de-cables",
    cara: "atras",
    capa: "atras",
    ancho: 68,
    ranuras: [1, 4, 0, 5, 2, 3],
    varias: true,
  },
};

/** El orden de la lista del armador. */
export const ARMADO_ORDEN: ArmadoSlug[] = [
  "soporte-celular",
  "bandeja",
  "porta-auriculares",
  "panel-de-flujo",
  "guia-de-cables",
];

/** Qué ranuras ocupa cada accesorio. Vacío o ausente: no está puesto. */
export type Armado = Partial<Record<ArmadoSlug, number[]>>;

/** El Sistema completo, armado como en la foto. */
export const ARMADO_SISTEMA: Armado = {
  "porta-auriculares": [0],
  "panel-de-flujo": [1],
  "soporte-celular": [3],
  bandeja: [4],
  "guia-de-cables": [1, 4],
};

type Colocado = { slug: ArmadoSlug; ranura: number };

function colocados(armado: Armado): Colocado[] {
  return ARMADO_ORDEN.flatMap((slug) =>
    (armado[slug] ?? []).map((ranura) => ({ slug, ranura })),
  );
}

function intervalo(slug: ArmadoSlug, ranura: number): [number, number] {
  const mitad = REGLAS[slug].ancho / 2;
  return [RANURA_X[ranura] - mitad, RANURA_X[ranura] + mitad];
}

/** Si `slug` puede ir en `ranura` con lo que ya está puesto. Lo que ese mismo
 *  accesorio ocupa hoy no cuenta (se está moviendo), salvo para las guías,
 *  que se suman. */
export function entra(armado: Armado, slug: ArmadoSlug, ranura: number): boolean {
  const regla = REGLAS[slug];
  if (!regla.ranuras.includes(ranura)) return false;
  const [a, b] = intervalo(slug, ranura);

  return colocados(armado).every((otro) => {
    if (otro.slug === slug && !regla.varias) return true;
    const reglaOtro = REGLAS[otro.slug];
    if (reglaOtro.cara !== regla.cara) return true;
    if (otro.ranura === ranura) return false;
    if (reglaOtro.capa !== regla.capa) return true;
    const [c, d] = intervalo(otro.slug, otro.ranura);
    return b <= c || d <= a;
  });
}

/** La primera ranura donde entra, o null si no hay lugar. */
export function primeraLibre(armado: Armado, slug: ArmadoSlug): number | null {
  return REGLAS[slug].ranuras.find((r) => entra(armado, slug, r)) ?? null;
}

/** Pone o saca un accesorio. Para las guías, `ranura` dice cuál. */
export function alternar(armado: Armado, slug: ArmadoSlug, ranura?: number): Armado {
  const actuales = armado[slug] ?? [];

  if (REGLAS[slug].varias && ranura !== undefined) {
    if (actuales.includes(ranura)) {
      return { ...armado, [slug]: actuales.filter((r) => r !== ranura) };
    }
    if (!entra(armado, slug, ranura)) return armado;
    return { ...armado, [slug]: [...actuales, ranura].sort() };
  }

  if (actuales.length) return { ...armado, [slug]: [] };
  const libre = primeraLibre(armado, slug);
  return libre === null ? armado : { ...armado, [slug]: [libre] };
}

/** Pasa un accesorio (de los de una sola unidad) a otra ranura. */
export function mover(armado: Armado, slug: ArmadoSlug, ranura: number): Armado {
  if (!entra(armado, slug, ranura)) return armado;
  return { ...armado, [slug]: [ranura] };
}

export function cantidad(armado: Armado, slug: ArmadoSlug): number {
  return armado[slug]?.length ?? 0;
}

/** Si lo armado es exactamente lo que trae el Sistema completo. */
export function esSistema(armado: Armado): boolean {
  return ARMADO_ORDEN.every(
    (slug) => cantidad(armado, slug) === (ARMADO_SISTEMA[slug]?.length ?? 0),
  );
}

/** "Ranura 2 de adelante" para leer en voz alta y en el texto alternativo. */
export function nombreRanura(cara: ArmadoCara, ranura: number): string {
  return `ranura ${ranura + 1} de ${cara === "frente" ? "adelante" : "atrás"}`;
}
