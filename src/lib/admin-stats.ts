import type { TrendPoint } from "../components/admin/TrendChart";
import {
  dayKey,
  formatDayMonth,
  isPaid,
  rangeDays,
  rangeStart,
  type RangeId,
} from "./admin";
import type { Customer, Order, PageView } from "../types/admin";

// ── Períodos ──────────────────────────────────────────────────

export type Period = {
  from: Date;
  to: Date;
  /** Período inmediatamente anterior, para comparar. null en "Todo". */
  prevFrom: Date | null;
  prevTo: Date | null;
};

/** Bordes del rango elegido. En "Todo" arranca en la primera actividad real. */
export function periodFor(
  range: RangeId,
  orders: Order[],
  visits: PageView[],
): Period {
  const to = new Date();

  const start = rangeStart(range);
  if (start) {
    // El período anterior tiene exactamente la misma cantidad de días y termina
    // justo antes del actual: los días se cuentan del rango, no del reloj, para
    // que la comparación no se corra según la hora en que se abre el panel.
    const days = rangeDays(range)!;
    const prevTo = new Date(start.getTime() - 1);
    const prevFrom = new Date(start);
    prevFrom.setDate(prevFrom.getDate() - days);
    return { from: start, to, prevFrom, prevTo };
  }

  const dates = [
    ...orders.map((order) => new Date(order.createdAt).getTime()),
    ...visits.map((visit) => new Date(visit.createdAt).getTime()),
  ];
  const from = dates.length ? new Date(Math.min(...dates)) : new Date();
  from.setHours(0, 0, 0, 0);
  return { from, to, prevFrom: null, prevTo: null };
}

// ── Series para el gráfico ────────────────────────────────────

export type Bucket = "day" | "week" | "month";

/** Con más de mes y medio, un día por barra no se lee: agrupamos. */
export function bucketFor(from: Date, to: Date): Bucket {
  const days = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
  if (days <= 45) return "day";
  if (days <= 200) return "week";
  return "month";
}

/** Inicio del bucket al que cae una fecha. Es la clave con la que se agrupa. */
export function bucketStart(date: Date, bucket: Bucket): Date {
  const out = new Date(date);
  out.setHours(0, 0, 0, 0);
  if (bucket === "week") {
    // Semanas de lunes a domingo (getDay: 0 = domingo)
    const weekday = (out.getDay() + 6) % 7;
    out.setDate(out.getDate() - weekday);
  }
  if (bucket === "month") out.setDate(1);
  return out;
}

const monthFormatter = new Intl.DateTimeFormat("es-AR", {
  month: "short",
  year: "2-digit",
});

function bucketLabel(date: Date, bucket: Bucket): string {
  if (bucket === "month") return monthFormatter.format(date);
  return formatDayMonth(date);
}

export type SeriesEntry = { date: Date; value: number };

/** Serie completa del período: los buckets sin actividad quedan en cero. */
export function buildSeries(
  entries: SeriesEntry[],
  period: Period,
  bucket: Bucket,
): TrendPoint[] {
  const points = new Map<string, TrendPoint>();

  const cursor = bucketStart(period.from, bucket);
  const end = bucketStart(period.to, bucket);
  while (cursor <= end) {
    const key = dayKey(cursor);
    points.set(key, { key, label: bucketLabel(cursor, bucket), value: 0 });
    if (bucket === "day") cursor.setDate(cursor.getDate() + 1);
    else if (bucket === "week") cursor.setDate(cursor.getDate() + 7);
    else cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const entry of entries) {
    const key = dayKey(bucketStart(entry.date, bucket));
    const point = points.get(key);
    if (point) point.value += entry.value;
  }

  return [...points.values()];
}

// ── KPIs ──────────────────────────────────────────────────────

export type Kpis = {
  /** Solo órdenes pagadas */
  facturacion: number;
  ventas: number;
  ticket: number;
  unidades: number;
  visitas: number;
  sesiones: number;
  /** ventas / sesiones, en % */
  conversion: number;
  pendientes: number;
};

function inRange(iso: string, from: Date | null, to: Date | null): boolean {
  const time = new Date(iso).getTime();
  if (from && time < from.getTime()) return false;
  if (to && time > to.getTime()) return false;
  return true;
}

export function ordersIn(
  orders: Order[],
  from: Date | null,
  to: Date | null,
): Order[] {
  return orders.filter((order) => inRange(order.createdAt, from, to));
}

export function visitsIn(
  visits: PageView[],
  from: Date | null,
  to: Date | null,
): PageView[] {
  return visits.filter((visit) => inRange(visit.createdAt, from, to));
}

export function kpisFor(orders: Order[], visits: PageView[]): Kpis {
  const pagadas = orders.filter(isPaid);
  const facturacion = pagadas.reduce((total, order) => total + order.total, 0);
  const unidades = pagadas.reduce(
    (total, order) =>
      total + order.items.reduce((sum, item) => sum + item.qty, 0),
    0,
  );
  const sesiones = new Set(visits.map((visit) => visit.sessionId)).size;

  return {
    facturacion,
    ventas: pagadas.length,
    ticket: pagadas.length ? Math.round(facturacion / pagadas.length) : 0,
    unidades,
    visitas: visits.length,
    sesiones,
    conversion: sesiones ? (pagadas.length / sesiones) * 100 : 0,
    pendientes: orders.filter((order) => order.status === "pending").length,
  };
}

// ── Ranking de productos ──────────────────────────────────────

export type ProductSales = {
  slug: string;
  name: string;
  units: number;
  revenue: number;
};

/** Ranking por unidades vendidas, solo sobre órdenes cobradas. */
export function topProducts(orders: Order[]): ProductSales[] {
  const map = new Map<string, ProductSales>();

  for (const order of orders.filter(isPaid)) {
    for (const item of order.items) {
      const current = map.get(item.slug) ?? {
        slug: item.slug,
        name: item.name,
        units: 0,
        revenue: 0,
      };
      current.units += item.qty;
      current.revenue += item.price * item.qty;
      map.set(item.slug, current);
    }
  }

  return [...map.values()].sort((a, b) => b.units - a.units);
}

// ── Clientes ──────────────────────────────────────────────────

/** No hay tabla de clientes: se arma agrupando las órdenes por email. */
export function customersFromOrders(orders: Order[]): Customer[] {
  const map = new Map<string, Customer>();

  // De más vieja a más nueva, así first/last quedan bien sin comparar fechas
  const cronologicas = [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  for (const order of cronologicas) {
    const email = order.customerEmail.trim().toLowerCase();
    const current = map.get(email);
    const pagada = isPaid(order);

    if (!current) {
      map.set(email, {
        email,
        nombre: order.customerName,
        telefono: order.customerPhone,
        ciudad: order.shippingAddress?.ciudad ?? "",
        provincia: order.shippingAddress?.provincia ?? "",
        ordersCount: 1,
        paidCount: pagada ? 1 : 0,
        totalSpent: pagada ? order.total : 0,
        firstOrderAt: order.createdAt,
        lastOrderAt: order.createdAt,
      });
      continue;
    }

    current.ordersCount += 1;
    if (pagada) {
      current.paidCount += 1;
      current.totalSpent += order.total;
    }
    current.lastOrderAt = order.createdAt;
    // Los datos de contacto más recientes son los que valen
    current.nombre = order.customerName;
    current.telefono = order.customerPhone ?? current.telefono;
    current.ciudad = order.shippingAddress?.ciudad ?? current.ciudad;
    current.provincia = order.shippingAddress?.provincia ?? current.provincia;
  }

  return [...map.values()].sort((a, b) => b.totalSpent - a.totalSpent);
}

// ── Tráfico ───────────────────────────────────────────────────

export type PathCount = { label: string; count: number };

export function topPaths(visits: PageView[], limit = 8): PathCount[] {
  const map = new Map<string, number>();
  for (const visit of visits) {
    map.set(visit.path, (map.get(visit.path) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Orígenes de las sesiones nuevas. Sin referrer = tráfico directo. */
export function topReferrers(visits: PageView[], limit = 8): PathCount[] {
  const map = new Map<string, number>();

  for (const visit of visits.filter((v) => v.isNewSession)) {
    let label = "Directo";
    if (visit.referrer) {
      try {
        const host = new URL(visit.referrer).hostname.replace(/^www\./, "");
        label = host || "Directo";
      } catch {
        label = visit.referrer;
      }
    }
    map.set(label, (map.get(label) ?? 0) + 1);
  }

  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
