/**
 * Las cuentas de /admin/publicidad. Meta muestra cuarenta columnas; acá quedan
 * las que contestan algo: cuánto salió, cuánta gente entró a la tienda por eso
 * y qué hizo adentro.
 */
import type {
  DestinoCampana,
  EstadoCampana,
  MetaCampana,
  MetaDia,
  MetaPublico,
  TipoPublico,
} from "../types/meta";
import type { Order, PageView } from "../types/admin";
import { dayKey, isPaid, orderRevenue } from "./admin";
import { clasificarOrigen } from "./origen";

export const ESTADO_LABEL: Record<EstadoCampana, string> = {
  activa: "Activa",
  en_revision: "En preparación",
  completada: "Terminada",
  pausada: "Pausada",
  con_problema: "Con un problema",
};

export const DESTINO_LABEL: Record<DestinoCampana, string> = {
  web: "Manda a la tienda",
  perfil: "Manda al perfil de Instagram",
  otro: "Otro destino",
};

export type Totales = {
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

const CEROS: Totales = {
  gasto: 0,
  impresiones: 0,
  clics: 0,
  visitas: 0,
  interacciones: 0,
  reacciones: 0,
  guardados: 0,
  carritos: 0,
  checkouts: 0,
  compras: 0,
  valorCompras: 0,
};

export function sumarDias(dias: MetaDia[]): Totales {
  const total = { ...CEROS };
  for (const dia of dias) {
    for (const clave of Object.keys(total) as (keyof Totales)[]) {
      total[clave] += dia[clave];
    }
  }
  return total;
}

/** Mediodía local de un YYYY-MM-DD: con las 00:00 UTC, en Argentina el día se
 *  corre uno para atrás. */
export function fechaLocal(fecha: string): Date {
  return new Date(`${fecha}T12:00:00`);
}

export function diasEntre(dias: MetaDia[], from: Date, to: Date): MetaDia[] {
  const desde = dayKey(from);
  const hasta = dayKey(to);
  return dias.filter((d) => d.fecha >= desde && d.fecha <= hasta);
}

// ── Cada campaña ──────────────────────────────────────────────

/** Con menos visitas que esto, un costo por visita es casualidad: una sola
 *  persona más lo mueve un montón. */
export const MIN_VISITAS = 10;

/** Cuánto tiene que separarse del promedio para decir que es cara o barata */
const DIFERENCIA = 0.25;

export type Veredicto = "barata" | "cara" | "normal" | "pocos-datos";

export type CampanaConNumeros = MetaCampana & {
  totales: Totales;
  /** Lo que costó cada visita a la tienda. null si no manda a la tienda o no
   *  entró nadie. */
  costoVisita: number | null;
  /** Lo que costó cada clic, para las que mandan al perfil */
  costoClic: number | null;
  veredicto: Veredicto | null;
};

/** Solo lo que se gastó en mandar gente a la tienda. Dividir también por lo
 *  que se fue en visitas al perfil haría parecer cara cada visita. */
export function costoPorVisita(campanas: CampanaConNumeros[]): number | null {
  const web = campanas.filter((c) => c.destino === "web");
  const gasto = web.reduce((n, c) => n + c.totales.gasto, 0);
  const visitas = web.reduce((n, c) => n + c.totales.visitas, 0);
  return visitas > 0 ? gasto / visitas : null;
}

export function campanasConNumeros(
  campanas: MetaCampana[],
  dias: MetaDia[],
): CampanaConNumeros[] {
  const porCampana = new Map<string, MetaDia[]>();
  for (const dia of dias) {
    const lista = porCampana.get(dia.campanaId) ?? [];
    lista.push(dia);
    porCampana.set(dia.campanaId, lista);
  }

  const filas: CampanaConNumeros[] = campanas
    .filter((c) => porCampana.has(c.id))
    .map((c) => {
      const totales = sumarDias(porCampana.get(c.id)!);
      return {
        ...c,
        totales,
        costoVisita:
          c.destino === "web" && totales.visitas > 0
            ? totales.gasto / totales.visitas
            : null,
        costoClic: totales.clics > 0 ? totales.gasto / totales.clics : null,
        veredicto: null,
      };
    });

  const promedio = costoPorVisita(filas);
  // Con una sola para mirar, el promedio es ella misma: no hay contra qué medir
  const comparables = filas.filter(
    (f) => f.destino === "web" && f.totales.visitas >= MIN_VISITAS,
  );
  if (comparables.length < 2) return filas;

  for (const fila of filas) {
    if (fila.destino !== "web" || promedio === null) continue;
    if (fila.totales.visitas < MIN_VISITAS || fila.costoVisita === null) {
      fila.veredicto = "pocos-datos";
    } else if (fila.costoVisita < promedio * (1 - DIFERENCIA)) {
      fila.veredicto = "barata";
    } else if (fila.costoVisita > promedio * (1 + DIFERENCIA)) {
      fila.veredicto = "cara";
    } else {
      fila.veredicto = "normal";
    }
  }
  return filas;
}

// ── A quién se le mostró ──────────────────────────────────────

export type FilaPublico = {
  valor: string;
  gasto: number;
  clics: number;
  /** % de la plata que se llevó */
  parte: number;
};

const ORDEN_EDAD = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];

export function publicoDe(
  filas: MetaPublico[],
  tipo: TipoPublico,
  maximo = 8,
): FilaPublico[] {
  const propias = filas.filter((f) => f.tipo === tipo);
  const total = propias.reduce((n, f) => n + f.gasto, 0);
  if (total === 0) return [];

  const conParte = propias
    .map((f) => ({
      valor: f.valor,
      gasto: f.gasto,
      clics: f.clics,
      parte: (f.gasto / total) * 100,
    }))
    .sort((a, b) =>
      tipo === "edad"
        ? ORDEN_EDAD.indexOf(a.valor) - ORDEN_EDAD.indexOf(b.valor)
        : b.gasto - a.gasto,
    );

  if (conParte.length <= maximo) return conParte;
  const resto = conParte.slice(maximo);
  return [
    ...conParte.slice(0, maximo),
    {
      valor: `Otras ${resto.length}`,
      gasto: resto.reduce((n, f) => n + f.gasto, 0),
      clics: resto.reduce((n, f) => n + f.clics, 0),
      parte: resto.reduce((n, f) => n + f.parte, 0),
    },
  ];
}

// ── ¿Se nota en la tienda? ────────────────────────────────────

export type LadoDeLaComparacion = {
  dias: number;
  /** Sesiones por día, en promedio */
  sesiones: number;
  /** De esas, las que llegaron desde Instagram o Facebook */
  deRedes: number;
  ventas: number;
  facturacion: number;
};

/** Los días con un anuncio corriendo contra los demás del mismo período. No
 *  prueba que la venta vino del anuncio: solo muestra si la tienda se movió. */
export function compararDias(
  dias: MetaDia[],
  visits: PageView[],
  orders: Order[],
  from: Date,
  to: Date,
): { con: LadoDeLaComparacion; sin: LadoDeLaComparacion } | null {
  const conAnuncio = new Set(
    dias.filter((d) => d.gasto > 0).map((d) => d.fecha),
  );
  if (conAnuncio.size === 0 || visits.length === 0) return null;

  const sesiones = new Map<string, { dia: string; redes: boolean }>();
  for (const visit of visits) {
    const previa = sesiones.get(visit.sessionId);
    // La primera vista es la que trae las pistas de origen
    if (previa && !visit.isNewSession) continue;
    const { fuente } = clasificarOrigen(visit);
    sesiones.set(visit.sessionId, {
      dia: dayKey(new Date(visit.createdAt)),
      redes: fuente.includes("Instagram") || fuente.includes("Facebook"),
    });
  }

  const vacio = () => ({ dias: 0, sesiones: 0, deRedes: 0, ventas: 0, facturacion: 0 });
  const con = vacio();
  const sin = vacio();
  const lado = (dia: string) => (conAnuncio.has(dia) ? con : sin);

  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  while (cursor <= to) {
    lado(dayKey(cursor)).dias += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const sesion of sesiones.values()) {
    const l = lado(sesion.dia);
    l.sesiones += 1;
    if (sesion.redes) l.deRedes += 1;
  }
  for (const order of orders.filter(isPaid)) {
    const l = lado(dayKey(new Date(order.createdAt)));
    l.ventas += 1;
    l.facturacion += orderRevenue(order);
  }
  for (const l of [con, sin]) {
    if (l.dias === 0) continue;
    l.sesiones /= l.dias;
    l.deRedes /= l.dias;
  }
  return con.dias > 0 && sin.dias > 0 ? { con, sin } : null;
}
