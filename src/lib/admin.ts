import type {
  Order,
  OrderStatus,
  PaymentMethod,
  ShippingStatus,
} from "../types/admin";

// ── Etiquetas ─────────────────────────────────────────────────

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendiente",
  paid: "Pagada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
  refunded: "Devuelta",
};

export const SHIPPING_STATUS_LABEL: Record<ShippingStatus, string> = {
  pendiente: "Sin preparar",
  preparando: "Preparando",
  despachado: "Despachado",
  entregado: "Entregado",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  mp: "Mercado Pago",
  transferencia: "Transferencia",
};

export const SHIPPING_METHOD_LABEL: Record<string, string> = {
  retiro: "Retiro en depósito",
  "andreani-sucursal": "Andreani sucursal",
  "andreani-domicilio": "Andreani domicilio",
  "correo-sucursal": "Correo Argentino sucursal",
  "correo-domicilio": "Correo Argentino domicilio",
};

/** Los estados que cuentan como facturación real. */
export const PAID_STATUSES: OrderStatus[] = ["paid"];

export function isPaid(order: Order): boolean {
  return PAID_STATUSES.includes(order.status);
}

/** Lo que factura la tienda en una orden. El `total` incluye el envío, que es
 *  plata que pasa de largo hacia Andreani o el Correo: como
 *  `total = subtotal − descuento + envío`, restarle el envío deja justo lo que
 *  entra por producto. Sobre un ticket de $18.300 con un envío de $9.500 la
 *  diferencia es de más del 30%. */
export function orderRevenue(order: Order): number {
  return order.total - order.shippingCost;
}

// ── Pendientes: qué está esperando cada orden sin pagar ───────

/** Lo que el sitio promete cuando el pago es por transferencia: "te reservamos
 *  el pedido por 48 horas". Está escrito en el checkout, en la pantalla de
 *  gracias, en el FAQ y en el mail — si alguna vez cambia, cambia acá. */
export const RESERVA_HORAS = 48;

/** Una orden de Mercado Pago recién entrada puede estar pagándose ahora mismo:
 *  la orden se guarda antes de mandar a la pasarela. Pasadas estas horas ya no
 *  hay nadie del otro lado. */
export const ABANDONO_HORAS = 2;

/** Las dos cosas distintas que hoy comparten el estado `pending`: la
 *  transferencia que todavía tiene reserva y quien se fue sin pagar. */
export type PendingStage = "reservada" | "vencida" | "pagando" | "abandonada";

export const PENDING_STAGE_LABEL: Record<PendingStage, string> = {
  reservada: "Reserva en pie",
  vencida: "Reserva vencida",
  pagando: "En Mercado Pago",
  abandonada: "Carrito abandonado",
};

/** En qué anda una orden que sigue en `pending`. null si ya se resolvió. */
export function pendingStage(
  order: Order,
  now: number = Date.now(),
): PendingStage | null {
  if (order.status !== "pending") return null;
  const horas = (now - new Date(order.createdAt).getTime()) / 3_600_000;
  if (order.paymentMethod === "transferencia") {
    return horas >= RESERVA_HORAS ? "vencida" : "reservada";
  }
  return horas >= ABANDONO_HORAS ? "abandonada" : "pagando";
}

/** El momento exacto en que se cumplen las 48 h prometidas. */
export function reservaVence(order: Order): Date {
  return new Date(
    new Date(order.createdAt).getTime() + RESERVA_HORAS * 3_600_000,
  );
}

// ── Rangos de fecha ───────────────────────────────────────────

export const RANGES = [
  { id: "7d", label: "7 días", days: 7 },
  { id: "30d", label: "30 días", days: 30 },
  { id: "90d", label: "90 días", days: 90 },
  { id: "365d", label: "12 meses", days: 365 },
  { id: "all", label: "Todo", days: null },
] as const;

export type RangeId = (typeof RANGES)[number]["id"];

export function rangeDays(range: RangeId): number | null {
  return RANGES.find((r) => r.id === range)?.days ?? 30;
}

/** Arranque del rango, a las 00:00 hora local. null = sin límite. */
export function rangeStart(range: RangeId): Date | null {
  const days = rangeDays(range);
  if (days === null) return null;
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (days - 1));
  return date;
}

/** El período inmediatamente anterior, para comparar contra el actual. */
export function previousRangeStart(range: RangeId): Date | null {
  const days = rangeDays(range);
  if (days === null) return null;
  const date = rangeStart(range)!;
  date.setDate(date.getDate() - days);
  return date;
}

// ── Formato ───────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/** "3 min", "5 h", "2 d" — el hueco pelado, sin decir para qué lado. */
function gap(minutos: number): string {
  if (minutos < 60) return `${Math.max(1, Math.round(minutos))} min`;
  const horas = minutos / 60;
  if (horas < 24) return `${Math.floor(horas)} h`;
  return `${Math.floor(horas / 24)} d`;
}

/** "recién", "hace 20 min", "hace 2 d". */
export function timeAgo(date: string | Date, now: number = Date.now()): string {
  const minutos = (now - new Date(date).getTime()) / 60_000;
  if (minutos < 1) return "recién";
  return `hace ${gap(minutos)}`;
}

/** "en 6 h", "en 40 min". Si ya pasó, lo dice. */
export function timeUntil(
  date: string | Date,
  now: number = Date.now(),
): string {
  const minutos = (new Date(date).getTime() - now) / 60_000;
  if (minutos <= 0) return "ya se cumplió";
  return `en ${gap(minutos)}`;
}

/** Días enteros que pasaron desde una fecha. Nunca negativo. */
export function daysSince(date: string | Date, now: number = Date.now()): number {
  const dias = (now - new Date(date).getTime()) / 86_400_000;
  return Math.max(0, Math.floor(dias));
}

/** "hoy", "ayer", "hace 12 días", "hace 3 meses". Pasado el mes se cuenta en
 *  meses: "hace 154 días" no le dice nada a nadie. */
export function formatDaysAgo(dias: number): string {
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 31) return `hace ${dias} días`;
  if (dias < 365) {
    // Redondeando para abajo: "hace 1 mes" a los 45 días es más honesto que
    // decir 2 cuando todavía no se cumplieron.
    const meses = Math.floor(dias / 30);
    return `hace ${meses} ${meses === 1 ? "mes" : "meses"}`;
  }
  const anios = Math.floor(dias / 365);
  return `hace ${anios} ${anios === 1 ? "año" : "años"}`;
}

/** "12 ago" — para los ejes del gráfico. */
export function formatDayMonth(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
  }).format(date);
}

/** Precio corto para tarjetas: $1,2M / $340k / $8.500 */
export function formatCompactPrice(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toLocaleString("es-AR", {
      maximumFractionDigits: 1,
    })}M`;
  }
  if (Math.abs(value) >= 100_000) {
    return `$${Math.round(value / 1000).toLocaleString("es-AR")}k`;
  }
  return `$${Math.round(value).toLocaleString("es-AR")}`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toLocaleString("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

/** Variación entre dos períodos. null cuando el anterior fue 0 (no hay base). */
export function variation(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/** Clave YYYY-MM-DD en hora local, para agrupar por día sin correrse de zona. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Todos los días del rango, incluso los que no tuvieron actividad. */
export function daysBetween(from: Date, to: Date): Date[] {
  const out: Date[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  while (cursor <= to) {
    out.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

// ── Export CSV ────────────────────────────────────────────────

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  // Excel en es-AR abre el CSV con punto y coma, así que ese es el separador
  // que hay que escapar, además de comillas y saltos de línea.
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(";"),
    ...rows.map((row) => headers.map((h) => csvCell(row[h])).join(";")),
  ];
  // BOM: sin esto Excel se come los acentos
  return `﻿${lines.join("\r\n")}`;
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const csv = toCsv(rows);
  if (!csv) return;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Slug a partir del nombre, para los productos nuevos. */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Errores ───────────────────────────────────────────────────

/** Los errores de Supabase no son `Error`: llegan como objeto plano
 *  ({ message, details, hint, code }). Sin esto, `instanceof Error` da false y
 *  la pantalla muestra un "no se pudo guardar" pelado, justo cuando el código
 *  de Postgres era la única pista útil. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const { message, hint, code } = error as {
      message?: unknown;
      hint?: unknown;
      code?: unknown;
    };
    if (typeof message === "string" && message) {
      const detalle = typeof hint === "string" && hint ? ` ${hint}` : "";
      const codigo = typeof code === "string" && code ? ` (${code})` : "";
      return `${message}${codigo}.${detalle}`;
    }
  }
  return fallback;
}
