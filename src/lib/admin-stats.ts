import type { TrendPoint } from "../components/admin/TrendChart";
import {
  dayKey,
  daysSince,
  formatDayMonth,
  isPaid,
  orderRevenue,
  rangeDays,
  rangeStart,
  type RangeId,
} from "./admin";
import type { AdminProduct, Customer, Order, PageView } from "../types/admin";

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
  /** Solo órdenes pagadas, y sin la plata del envío (ver `orderRevenue`) */
  facturacion: number;
  /** Lo cobrado de envío en el período: no es facturación, se muestra aparte */
  envios: number;
  ventas: number;
  /** Facturación sobre ventas: también sin envío, para que sea comparable */
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
  const facturacion = pagadas.reduce(
    (total, order) => total + orderRevenue(order),
    0,
  );
  const envios = pagadas.reduce((total, order) => total + order.shippingCost, 0);
  const unidades = pagadas.reduce(
    (total, order) =>
      total + order.items.reduce((sum, item) => sum + item.qty, 0),
    0,
  );
  const sesiones = new Set(visits.map((visit) => visit.sessionId)).size;

  return {
    facturacion,
    envios,
    ventas: pagadas.length,
    ticket: pagadas.length ? Math.round(facturacion / pagadas.length) : 0,
    unidades,
    visitas: visits.length,
    sesiones,
    conversion: sesiones ? (pagadas.length / sesiones) * 100 : 0,
    pendientes: orders.filter((order) => order.status === "pending").length,
  };
}

// ── Ganancia ──────────────────────────────────────────────────

export type Profit = {
  /** Facturación sin envío de las órdenes cobradas */
  revenue: number;
  /** Costo de materiales de las unidades vendidas que tienen costo cargado */
  cost: number;
  /** revenue − cost */
  profit: number;
  /** Ganancia sobre facturación, en % */
  margin: number;
  /** Unidades vendidas sin costo cargado: el costo real es mayor que `cost` */
  unitsWithoutCost: number;
  /** Y de qué productos son, para poder decir cuáles faltan cargar */
  productsWithoutCost: string[];
};

/**
 * Ganancia del período: facturación menos el costo de materiales de lo que se
 * vendió. La mano de obra no entra — es la misma cuenta que hace
 * `/admin/precios` con "Ganancia" por producto, y la decisión está fechada en
 * el vault.
 *
 * Dos límites que la tarjeta tiene que decir en pantalla:
 *
 * - El costo es el **de hoy**, no el que tenía el producto el día de la venta.
 *   Las órdenes guardan el precio cobrado pero no el costo, así que si mañana
 *   sube la tela, la ganancia de las ventas viejas se recalcula con el costo
 *   nuevo.
 * - Un producto sin costo cargado cuenta como costo cero, así que infla la
 *   ganancia. Por eso se devuelven las unidades y los nombres involucrados.
 */
export function profitFor(orders: Order[], products: AdminProduct[]): Profit {
  const costBySlug = new Map(
    products.map((product) => [product.slug, product.cost]),
  );

  let revenue = 0;
  let cost = 0;
  let unitsWithoutCost = 0;
  // slug → nombre, para no repetir el mismo producto en el aviso
  const sinCosto = new Map<string, string>();

  for (const order of orders.filter(isPaid)) {
    revenue += orderRevenue(order);
    for (const item of order.items) {
      // `undefined` = el producto ya no está en el catálogo; `null` = está
      // pero nunca se le cargó el costo. Las dos cosas se avisan igual.
      const unitCost = costBySlug.get(item.slug);
      if (unitCost === undefined || unitCost === null) {
        unitsWithoutCost += item.qty;
        sinCosto.set(item.slug, item.name);
        continue;
      }
      cost += unitCost * item.qty;
    }
  }

  // Los costos se cargan a mano y pueden traer decimales; los precios no.
  // Redondear acá evita que la tarjeta muestre $9.149,999999.
  cost = Math.round(cost);
  const profit = revenue - cost;

  return {
    revenue,
    cost,
    profit,
    margin: revenue ? (profit / revenue) * 100 : 0,
    unitsWithoutCost,
    productsWithoutCost: [...sinCosto.values()],
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
        totalSpent: pagada ? orderRevenue(order) : 0,
        firstOrderAt: order.createdAt,
        lastOrderAt: order.createdAt,
        lastPaidOrderAt: pagada ? order.createdAt : null,
      });
      continue;
    }

    current.ordersCount += 1;
    if (pagada) {
      current.paidCount += 1;
      current.totalSpent += orderRevenue(order);
      current.lastPaidOrderAt = order.createdAt;
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

/** A partir de acá el cliente cuenta como dormido y entra en la lista de
 *  WhatsApp del mes. Dos meses es el corte: menos que eso todavía es alguien
 *  que compró recién. */
export const DIAS_DORMIDO = 60;
/** Entre este corte y el anterior, el cliente se está enfriando. */
export const DIAS_TIBIO = 30;

export type CustomerTemp = "sin-compra" | "reciente" | "tibio" | "dormido";

/** Hace cuánto no compra, y qué tan lejos quedó. `dias` es null cuando nunca
 *  pagó una orden: no es lo mismo que hace mucho que no compra. */
export function customerLapse(
  customer: Customer,
  now: number = Date.now(),
): { dias: number | null; temp: CustomerTemp } {
  if (!customer.lastPaidOrderAt) return { dias: null, temp: "sin-compra" };
  const dias = daysSince(customer.lastPaidOrderAt, now);
  if (dias >= DIAS_DORMIDO) return { dias, temp: "dormido" };
  if (dias >= DIAS_TIBIO) return { dias, temp: "tibio" };
  return { dias, temp: "reciente" };
}

// ── Stock ─────────────────────────────────────────────────────

/** Misma forma que `cartKey` en useCart: así el stock reservado de una
 *  orden (que guarda `slug` + `variant_id`) se cruza con la línea correcta. */
export function stockLineKey(slug: string, variantId?: string | null): string {
  return `${slug}::${variantId ?? ""}`;
}

/** Una fila de stock: el producto entero si no tiene variantes, o una fila
 *  por cada variante — así el panel controla y muestra el stock al nivel
 *  en el que realmente se vende. */
export type StockLine = {
  key: string;
  productId: number;
  productSlug: string;
  productName: string;
  category: string;
  sku: string | null;
  /** El toggle "a la venta" es del producto entero, no de la variante. */
  productInStock: boolean;
  variantId: string | null;
  variantLabel: string | null;
  stock: number | null;
};

export function stockLines(products: AdminProduct[]): StockLine[] {
  const lines: StockLine[] = [];
  for (const product of products) {
    if (product.variants?.length) {
      for (const variant of product.variants) {
        lines.push({
          key: stockLineKey(product.slug, variant.id),
          productId: product.id,
          productSlug: product.slug,
          productName: product.name,
          category: product.category,
          sku: product.sku,
          productInStock: product.inStock,
          variantId: variant.id,
          variantLabel: variant.label,
          stock: variant.stock,
        });
      }
    } else {
      lines.push({
        key: stockLineKey(product.slug),
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        category: product.category,
        sku: product.sku,
        productInStock: product.inStock,
        variantId: null,
        variantLabel: null,
        stock: product.stock,
      });
    }
  }
  return lines;
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

// ── Vistas y conversión por producto ──────────────────────────

/** Con lo que la tienda rutea las fichas. `page_views` no guarda el producto:
 *  guarda el `path`, y el slug es lo que viene después de este prefijo. */
const PRODUCT_PATH = "/producto/";

/**
 * Slug de la ficha que mira una visita, o null si esa visita no es una ficha.
 *
 * Saca query, hash y la barra final: `/producto/tote-domingo/?utm=ig` y
 * `/producto/tote-domingo` son la misma ficha. Hoy `trackVisit` guarda
 * `location.pathname` pelado, pero alcanza con que alguien llegue de una
 * campaña con `?utm=` para que el mismo producto se parta en dos filas.
 */
export function productSlugFromPath(path: string): string | null {
  const clean = path.split("?")[0].split("#")[0].replace(/\/+$/, "");
  if (!clean.startsWith(PRODUCT_PATH)) return null;
  return clean.slice(PRODUCT_PATH.length) || null;
}

/** Debajo de estas vistas no hay con qué opinar: cinco visitas sin compra
 *  puede ser un día flojo, no un problema del producto. */
export const MIN_VISTAS_SENAL = 10;

/** Lo que la tabla marca en pantalla. */
export type ProductSignal = "mirado-sin-vender" | "convierte-poco";

export type ProductFunnelRow = {
  slug: string;
  name: string;
  /** false cuando el slug aparece en visitas o ventas pero ya no está en el
   *  catálogo: una ficha vieja, renombrada o borrada. */
  inCatalog: boolean;
  /** Vistas de la ficha en el período. No son sesiones: la visita repetida
   *  de la misma persona cuenta cada vez. */
  views: number;
  /** Sesiones distintas que abrieron la ficha */
  sessions: number;
  /** Unidades vendidas en órdenes cobradas */
  units: number;
  /** Órdenes cobradas que incluyeron el producto. Una orden cuenta una sola
   *  vez aunque lleve dos variantes del mismo producto. */
  orders: number;
  /** órdenes ÷ vistas, en % */
  conversion: number;
  signal: ProductSignal | null;
};

export type ProductFunnel = {
  rows: ProductFunnelRow[];
  /** Totales de ficha del período, para la línea de resumen */
  views: number;
  units: number;
  orders: number;
  /** El promedio contra el que se compara cada fila: órdenes de ficha ÷
   *  vistas de ficha del período, en %. */
  conversion: number;
};

type FunnelAcc = Omit<ProductFunnelRow, "conversion" | "signal" | "sessions"> & {
  sessionIds: Set<string>;
};

/**
 * Cruza las visitas a fichas con las ventas cobradas para contestar la
 * pregunta de la semana del lanzamiento: qué producto se mira mucho y se
 * vende poco.
 *
 * Tres límites que la pantalla tiene que decir en voz alta:
 *
 * - La conversión es **órdenes ÷ vistas**, no sobre sesiones: la misma persona
 *   que vuelve tres veces a la ficha cuenta tres veces en el denominador. Es
 *   la cuenta más dura de las dos.
 * - Quien compra sin pasar por la ficha —carrito guardado, link directo al
 *   checkout— suma orden sin sumar vista, así que un producto puede dar más
 *   de 100%.
 * - Si en el período no se vendió nada, ninguna fila se marca: con cero ventas
 *   en toda la tienda, "se mira y no se vende" no dice nada del producto.
 */
export function productFunnel(
  products: AdminProduct[],
  orders: Order[],
  visits: PageView[],
): ProductFunnel {
  const acc = new Map<string, FunnelAcc>();

  const ensure = (
    slug: string,
    name: string | null,
    fromCatalog: boolean,
  ): FunnelAcc => {
    const current = acc.get(slug);
    if (current) {
      // El nombre del catálogo gana siempre; el de la orden solo rellena
      // mientras el producto no esté en el catálogo.
      if (fromCatalog) {
        current.name = name ?? current.name;
        current.inCatalog = true;
      } else if (!current.inCatalog && name) {
        current.name = name;
      }
      return current;
    }
    const created: FunnelAcc = {
      slug,
      name: name ?? slug,
      inCatalog: fromCatalog,
      views: 0,
      units: 0,
      orders: 0,
      sessionIds: new Set<string>(),
    };
    acc.set(slug, created);
    return created;
  };

  // El catálogo entero entra aunque no tenga una sola vista: un producto que
  // nadie mira es un dato, no una fila que convenga esconder.
  for (const product of products) ensure(product.slug, product.name, true);

  for (const visit of visits) {
    const slug = productSlugFromPath(visit.path);
    if (!slug) continue;
    const row = ensure(slug, null, false);
    row.views += 1;
    row.sessionIds.add(visit.sessionId);
  }

  for (const order of orders.filter(isPaid)) {
    const enLaOrden = new Set<string>();
    for (const item of order.items) {
      const row = ensure(item.slug, item.name, false);
      row.units += item.qty;
      enLaOrden.add(item.slug);
    }
    for (const slug of enLaOrden) acc.get(slug)!.orders += 1;
  }

  const totals = { views: 0, units: 0, orders: 0 };
  for (const row of acc.values()) {
    totals.views += row.views;
    totals.units += row.units;
    totals.orders += row.orders;
  }
  const promedio = totals.views ? (totals.orders / totals.views) * 100 : 0;

  const rows: ProductFunnelRow[] = [...acc.values()].map((row) => {
    const conversion = row.views ? (row.orders / row.views) * 100 : 0;

    let signal: ProductSignal | null = null;
    if (row.views >= MIN_VISTAS_SENAL && totals.orders > 0) {
      if (row.orders === 0) signal = "mirado-sin-vender";
      // La mitad del promedio: no marcamos cualquier diferencia, solo la que
      // se nota. Con el promedio en 2%, salta lo que está abajo de 1%.
      else if (conversion < promedio / 2) signal = "convierte-poco";
    }

    return {
      slug: row.slug,
      name: row.name,
      inCatalog: row.inCatalog,
      views: row.views,
      sessions: row.sessionIds.size,
      units: row.units,
      orders: row.orders,
      conversion,
      signal,
    };
  });

  // Orden por defecto: primero lo marcado y, dentro de cada grupo, lo más
  // visto. Los dos rótulos pesan igual — entre una ficha muy mirada que
  // convierte al 1% y una poco mirada que no vendió nunca, la primera es la
  // que mueve el número. Las columnas siguen siendo ordenables a mano.
  rows.sort((a, b) => {
    const marcadas = Number(b.signal !== null) - Number(a.signal !== null);
    if (marcadas) return marcadas;
    if (b.views !== a.views) return b.views - a.views;
    return a.name.localeCompare(b.name, "es-AR");
  });

  return { rows, ...totals, conversion: promedio };
}
