import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminDrawer from "../../components/admin/AdminDrawer";
import AdminTable from "../../components/admin/AdminTable";
import PageHeading from "../../components/admin/PageHeading";
import QueryError from "../../components/admin/QueryError";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import Button from "../../components/Button";
import SelectField from "../../components/SelectField";
import TextField from "../../components/TextField";
import TextareaField from "../../components/TextareaField";
import { useAdminOrders, useUpdateOrder } from "../../hooks/useAdminOrders";
import {
  ORDER_STATUS_LABEL,
  PAYMENT_LABEL,
  PENDING_STAGE_LABEL,
  RESERVA_HORAS,
  SHIPPING_METHOD_LABEL,
  SHIPPING_STATUS_LABEL,
  downloadCsv,
  errorMessage,
  formatCompactPrice,
  formatDate,
  formatDateTime,
  isPaid,
  orderRevenue,
  pendingStage,
  reservaVence,
  timeAgo,
  timeUntil,
  type PendingStage,
} from "../../lib/admin";
import { cn } from "../../lib/cn";
import { formatPrice } from "../../lib/format";
import { SITE } from "../../lib/site";
import type { Order, OrderStatus, ShippingStatus } from "../../types/admin";

const ESTADOS: (OrderStatus | "todos")[] = [
  "todos",
  "pending",
  "paid",
  "rejected",
  "cancelled",
  "refunded",
];

/** Dos atajos que no son estados de la base: salen de mirar hace cuánto entró
 *  una orden que sigue en `pending`. Van en el mismo grupo de filtros porque
 *  se usan igual, pero separados: "Pendientes" las incluye a las dos. */
const ATAJOS = ["vencidas", "abandonados"] as const;
type Atajo = (typeof ATAJOS)[number];
type Filtro = OrderStatus | "todos" | Atajo;

const ATAJO_LABEL: Record<Atajo, string> = {
  vencidas: "Vencidas",
  abandonados: "Abandonados",
};

const ATAJO_STAGE: Record<Atajo, PendingStage> = {
  vencidas: "vencida",
  abandonados: "abandonada",
};

/** La línea corta que va debajo del estado en la tabla. */
function pendingNote(order: Order, stage: PendingStage): string {
  switch (stage) {
    case "reservada":
      return `vence ${timeUntil(reservaVence(order))}`;
    case "vencida":
      return `venció ${timeAgo(reservaVence(order))}`;
    case "pagando":
      return `pagando, ${timeAgo(order.createdAt)}`;
    case "abandonada":
      return `sin pagar ${timeAgo(order.createdAt)}`;
  }
}

const VISTAS = ["tabla", "kanban"] as const;
type Vista = (typeof VISTAS)[number];

/** El filtro de fechas se guarda como `YYYY-MM-DD` en la URL. */
const DIA_RE = /^\d{4}-\d{2}-\d{2}$/;

/** `YYYY-MM-DD` de un día local. `toISOString()` no sirve: pasa a UTC y en
 *  Argentina eso corre la fecha un día para atrás. */
function isoDay(date: Date): string {
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mes}-${dia}`;
}

/** `YYYY-MM` del mes al que pertenece una orden. */
function mesKey(date: Date): string {
  return isoDay(date).slice(0, 7);
}

/** Primer y último día de un mes `YYYY-MM`, como los espera el filtro. */
function mesRango(key: string): { desde: string; hasta: string } {
  const [anio, mes] = key.split("-").map(Number);
  return {
    desde: isoDay(new Date(anio, mes - 1, 1)),
    hasta: isoDay(new Date(anio, mes, 0)),
  };
}

const mesFormatter = new Intl.DateTimeFormat("es-AR", {
  month: "long",
  year: "numeric",
});

/** "Septiembre 2026" — el formateador devuelve "septiembre de 2026". */
function mesLabel(date: Date): string {
  const texto = mesFormatter.format(date).replace(" de ", " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Columnas del kanban de despacho, en el orden en que avanza un pedido. */
const KANBAN_COLUMNAS: ShippingStatus[] = [
  "pendiente",
  "preparando",
  "despachado",
  "entregado",
];

/** Link de WhatsApp al cliente, con el número tal como lo dejó en el checkout. */
function whatsappLink(order: Order): string | null {
  if (!order.customerPhone) return null;
  const digits = order.customerPhone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  // Sin código de país lo asumimos argentino (54 + 9 de celular)
  const numero = digits.startsWith("54") ? digits : `549${digits.replace(/^0/, "")}`;
  const texto = `Hola ${order.customerName.split(" ")[0]}! Te escribo de ${SITE.name} por tu pedido ${order.id.slice(0, 8).toUpperCase()}.`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

export default function AdminVentas() {
  const orders = useAdminOrders();
  const updateOrder = useUpdateOrder();
  const [searchParams, setSearchParams] = useSearchParams();

  const estado = (searchParams.get("estado") ?? "todos") as Filtro;
  const vista = (searchParams.get("vista") ?? "tabla") as Vista;
  const desde = searchParams.get("desde") ?? "";
  const hasta = searchParams.get("hasta") ?? "";
  const [busqueda, setBusqueda] = useState("");
  const [abierta, setAbierta] = useState<Order | null>(null);

  // Kanban: qué tarjeta se está arrastrando / soltando, y el error de la
  // última movida si el guardado falla (el resto del panel usa el mismo patrón).
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumna, setDragOverColumna] = useState<ShippingStatus | null>(
    null,
  );
  const [movingId, setMovingId] = useState<string | null>(null);
  const [kanbanError, setKanbanError] = useState<string | null>(null);

  // Borrador de la orden abierta: se guarda con el botón, no en cada tecla
  const [patch, setPatch] = useState<{
    status: OrderStatus;
    shippingStatus: ShippingStatus;
    trackingCode: string;
    adminNotes: string;
  } | null>(null);

  const todas = orders.data ?? [];

  /** Los dos extremos del filtro, en milisegundos. `null` = sin límite de ese
   *  lado, así que "desde el 1/9" sin "hasta" también funciona. */
  const { inicio, fin } = useMemo(() => {
    return {
      inicio: DIA_RE.test(desde)
        ? new Date(`${desde}T00:00:00`).getTime()
        : null,
      // El día "hasta" entra entero: si no, las ventas de esa mañana se pierden
      fin: DIA_RE.test(hasta)
        ? new Date(`${hasta}T23:59:59.999`).getTime()
        : null,
    };
  }, [desde, hasta]);

  const hayFecha = inicio !== null || fin !== null;

  /** Las órdenes del período elegido: la base de los totales y de la tabla. */
  const enFecha = useMemo(() => {
    if (!hayFecha) return todas;
    return todas.filter((order) => {
      const momento = new Date(order.createdAt).getTime();
      if (inicio !== null && momento < inicio) return false;
      if (fin !== null && momento > fin) return false;
      return true;
    });
  }, [todas, hayFecha, inicio, fin]);

  /** Los meses que tienen al menos una orden, del más nuevo al más viejo:
   *  es el atajo para "las ventas de septiembre" sin tipear dos fechas. */
  const meses = useMemo(() => {
    const porKey = new Map<string, string>();
    for (const order of todas) {
      const fecha = new Date(order.createdAt);
      const key = mesKey(fecha);
      if (!porKey.has(key)) porKey.set(key, mesLabel(fecha));
    }
    return [...porKey.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [todas]);

  /** Qué opción del select está activa. `""` = todas, `"custom"` = dos fechas
   *  sueltas que no son un mes calendario completo. */
  const mesElegido = useMemo(() => {
    if (!desde && !hasta) return "";
    if (DIA_RE.test(desde) && DIA_RE.test(hasta)) {
      const key = desde.slice(0, 7);
      const rango = mesRango(key);
      if (rango.desde === desde && rango.hasta === hasta) return key;
    }
    return "custom";
  }, [desde, hasta]);

  const setFechas = (proximoDesde: string, proximoHasta: string) => {
    const next = new URLSearchParams(searchParams);
    if (proximoDesde) next.set("desde", proximoDesde);
    else next.delete("desde");
    if (proximoHasta) next.set("hasta", proximoHasta);
    else next.delete("hasta");
    setSearchParams(next, { replace: true });
  };

  const visibles = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    const ahora = Date.now();
    return enFecha.filter((order) => {
      if (estado === "vencidas" || estado === "abandonados") {
        if (pendingStage(order, ahora) !== ATAJO_STAGE[estado]) return false;
      } else if (estado !== "todos" && order.status !== estado) {
        return false;
      }
      if (!term) return true;
      return (
        order.customerName.toLowerCase().includes(term) ||
        order.customerEmail.toLowerCase().includes(term) ||
        order.id.toLowerCase().startsWith(term) ||
        (order.trackingCode ?? "").toLowerCase().includes(term)
      );
    });
  }, [enFecha, estado, busqueda]);

  // Los totales siguen el filtro de fechas, no la búsqueda ni el estado: es lo
  // que se copia a la planilla como "lo que facturé en septiembre".
  const totales = useMemo(() => {
    const pagadas = enFecha.filter(isPaid);
    const ahora = Date.now();
    const stages = enFecha.map((order) => pendingStage(order, ahora));
    return {
      facturado: pagadas.reduce((total, order) => total + orderRevenue(order), 0),
      pagadas: pagadas.length,
      pendientes: enFecha.filter((order) => order.status === "pending").length,
      vencidas: stages.filter((stage) => stage === "vencida").length,
      abandonados: stages.filter((stage) => stage === "abandonada").length,
      porDespachar: pagadas.filter(
        (order) =>
          order.shippingStatus === "pendiente" ||
          order.shippingStatus === "preparando",
      ).length,
    };
  }, [enFecha]);

  // El kanban gestiona despachos: solo tiene sentido para pedidos ya
  // cobrados, respeta el mismo filtro de búsqueda que la tabla.
  const kanbanOrders = useMemo(() => visibles.filter(isPaid), [visibles]);

  const moverA = async (order: Order, next: ShippingStatus) => {
    if (order.shippingStatus === next) return;
    setKanbanError(null);
    setMovingId(order.id);
    try {
      await updateOrder.mutateAsync({
        id: order.id,
        patch: { shippingStatus: next },
      });
    } catch (error) {
      setKanbanError(errorMessage(error, "No se pudo mover el pedido"));
    } finally {
      setMovingId(null);
    }
  };

  /** El archivo dice de qué período es: sirve para no pisar el de agosto con
   *  el de septiembre en la carpeta de descargas. */
  const csvNombre = hayFecha
    ? `dz-ventas-${desde || "inicio"}_${hasta || isoDay(new Date())}.csv`
    : "dz-ventas.csv";

  const abrir = (order: Order) => {
    setAbierta(order);
    setPatch({
      status: order.status,
      shippingStatus: order.shippingStatus,
      trackingCode: order.trackingCode ?? "",
      adminNotes: order.adminNotes ?? "",
    });
  };

  const guardar = async () => {
    if (!abierta || !patch) return;
    await updateOrder.mutateAsync({
      id: abierta.id,
      patch: {
        status: patch.status,
        shippingStatus: patch.shippingStatus,
        trackingCode: patch.trackingCode,
        adminNotes: patch.adminNotes,
      },
    });
    setAbierta(null);
    setPatch(null);
  };

  if (orders.error) {
    return (
      <>
        <PageHeading title="Ventas" />
        <QueryError error={orders.error} what="las ventas" />
      </>
    );
  }

  return (
    <>
      <PageHeading
        title={
          <>
            Ventas y{" "}
            <em className="font-serif font-normal italic text-petroleo">
              pedidos
            </em>
          </>
        }
        description="Cada orden que entró por el checkout. Desde acá se confirma el pago, se marca el despacho y se carga el seguimiento."
      >
        <Button
          variant="secondary"
          className="px-5 py-2.5"
          onClick={() =>
            downloadCsv(
              csvNombre,
              visibles.map((order) => ({
                Orden: order.id.slice(0, 8).toUpperCase(),
                Fecha: formatDateTime(order.createdAt),
                Cliente: order.customerName,
                Email: order.customerEmail,
                Telefono: order.customerPhone ?? "",
                Provincia: order.shippingAddress?.provincia ?? "",
                Ciudad: order.shippingAddress?.ciudad ?? "",
                Envio:
                  SHIPPING_METHOD_LABEL[order.shippingMethod] ??
                  order.shippingMethod,
                Pago: PAYMENT_LABEL[order.paymentMethod],
                Subtotal: order.subtotal,
                Descuento: order.discount,
                Envio_costo: order.shippingCost,
                Total: order.total,
                Facturado_sin_envio: orderRevenue(order),
                Estado: ORDER_STATUS_LABEL[order.status],
                // Para armar la lista de a quién escribirle sin abrir el panel
                Pendiente: (() => {
                  const stage = pendingStage(order);
                  return stage ? PENDING_STAGE_LABEL[stage] : "";
                })(),
                Envio_estado: SHIPPING_STATUS_LABEL[order.shippingStatus],
                Seguimiento: order.trackingCode ?? "",
              })),
            )
          }
        >
          Bajar CSV
        </Button>
      </PageHeading>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={hayFecha ? "Facturado del período" : "Facturado total"}
          value={formatCompactPrice(totales.facturado)}
          hint="órdenes cobradas, sin el envío"
        />
        <StatCard label="Ventas cobradas" value={String(totales.pagadas)} />
        <StatCard
          label="Pendientes"
          value={String(totales.pendientes)}
          hint={
            totales.vencidas || totales.abandonados
              ? [
                  totales.vencidas &&
                    `${totales.vencidas} con la reserva vencida`,
                  totales.abandonados && `${totales.abandonados} sin pagar`,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "esperan pago o confirmación"
          }
        />
        <StatCard
          label="Por despachar"
          value={String(totales.porDespachar)}
          hint="cobradas y sin salir"
        />
      </div>

      <div className="mb-3 mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar por cliente, email, orden o seguimiento"
          aria-label="Buscar ventas"
          className="w-full rounded-full border border-ink/20 bg-white px-5 py-2.5 font-mono text-xs focus:border-ink focus:outline-none sm:max-w-sm"
        />

        <div
          role="group"
          aria-label="Filtrar por estado"
          className="flex flex-wrap gap-1 rounded-full bg-white p-1"
        >
          {ESTADOS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={estado === id}
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                if (id === "todos") next.delete("estado");
                else next.set("estado", id);
                setSearchParams(next, { replace: true });
              }}
              className={cn(
                "rounded-full px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-widest transition-colors",
                estado === id ? "bg-ink text-cream" : "text-ink/65 hover:text-ink",
              )}
            >
              {id === "todos" ? "Todas" : ORDER_STATUS_LABEL[id]}
            </button>
          ))}

          <span aria-hidden="true" className="my-1 w-px bg-ink/10" />

          {ATAJOS.map((id) => {
            const cuantas =
              id === "vencidas" ? totales.vencidas : totales.abandonados;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={estado === id}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set("estado", id);
                  setSearchParams(next, { replace: true });
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-widest transition-colors",
                  estado === id ? "bg-ink text-cream" : "text-ink/65 hover:text-ink",
                )}
              >
                {ATAJO_LABEL[id]}
                {cuantas > 0 && ` ${cuantas}`}
              </button>
            );
          })}
        </div>

        <div
          role="group"
          aria-label="Cambiar vista"
          className="flex gap-1 rounded-full bg-white p-1 sm:ml-auto"
        >
          {VISTAS.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={vista === v}
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                if (v === "tabla") next.delete("vista");
                else next.set("vista", v);
                setSearchParams(next, { replace: true });
              }}
              className={cn(
                "rounded-full px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-widest transition-colors",
                vista === v ? "bg-ink text-cream" : "text-ink/65 hover:text-ink",
              )}
            >
              {v === "tabla" ? "Tabla" : "Kanban"}
            </button>
          ))}
        </div>
      </div>

      {/* Fechas: el atajo del mes cubre el caso real ("bajame septiembre") y
          las dos fechas sueltas quedan para cualquier otro corte. */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink/65">
          Fechas
        </span>

        <select
          value={mesElegido}
          aria-label="Filtrar por mes"
          onChange={(event) => {
            const key = event.target.value;
            if (!key || key === "custom") setFechas("", "");
            else {
              const rango = mesRango(key);
              setFechas(rango.desde, rango.hasta);
            }
          }}
          className="rounded-full border border-ink/20 bg-white px-4 py-2 font-mono text-xs focus:border-ink focus:outline-none"
        >
          <option value="">Todas las fechas</option>
          {meses.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
          {mesElegido === "custom" && (
            <option value="custom">Rango a medida</option>
          )}
        </select>

        <input
          type="date"
          value={desde}
          max={hasta || undefined}
          aria-label="Desde"
          onChange={(event) => setFechas(event.target.value, hasta)}
          className="rounded-full border border-ink/20 bg-white px-4 py-2 font-mono text-xs focus:border-ink focus:outline-none"
        />
        <span aria-hidden="true" className="font-mono text-xs text-ink/45">
          →
        </span>
        <input
          type="date"
          value={hasta}
          min={desde || undefined}
          aria-label="Hasta"
          onChange={(event) => setFechas(desde, event.target.value)}
          className="rounded-full border border-ink/20 bg-white px-4 py-2 font-mono text-xs focus:border-ink focus:outline-none"
        />

        {hayFecha && (
          <button
            type="button"
            onClick={() => setFechas("", "")}
            className="rounded-full px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-ink/65 underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            Limpiar
          </button>
        )}

        {hayFecha && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink/65">
            {enFecha.length} {enFecha.length === 1 ? "orden" : "órdenes"} en el
            período
          </span>
        )}
      </div>

      {vista === "kanban" ? (
        <div className="space-y-3">
          <p className="rounded-xl bg-white px-4 py-3 text-xs leading-relaxed text-ink/65">
            ✦ Arrastrá un pedido a otra columna para cambiar su estado de
            envío. Al soltarlo en <strong>Despachado</strong>, el stock baja
            solo — ya no queda solo "comprometido".
          </p>

          {kanbanError && (
            <p className="rounded-xl bg-orange/10 px-4 py-3 text-xs text-orange">
              {kanbanError}
            </p>
          )}

          {orders.isLoading ? (
            <div className="rounded-2xl bg-white px-4 py-16 text-center font-mono text-xs uppercase tracking-widest text-ink/65">
              ✦ Cargando…
            </div>
          ) : kanbanOrders.length === 0 ? (
            <div className="rounded-2xl bg-white px-4 py-16 text-center text-sm text-ink/65">
              {todas.length === 0
                ? "Todavía no entró ninguna orden."
                : enFecha.length === 0
                  ? "No entró ninguna orden en ese período."
                  : "Ningún pedido pagado coincide con ese filtro."}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              {KANBAN_COLUMNAS.map((columna) => {
                const enColumna = kanbanOrders.filter(
                  (order) => order.shippingStatus === columna,
                );
                return (
                  <div
                    key={columna}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOverColumna(columna);
                    }}
                    onDragLeave={() =>
                      setDragOverColumna((current) =>
                        current === columna ? null : current,
                      )
                    }
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragOverColumna(null);
                      const id = event.dataTransfer.getData("text/plain");
                      const order = kanbanOrders.find((o) => o.id === id);
                      if (order) void moverA(order, columna);
                    }}
                    className={cn(
                      "flex min-h-[10rem] flex-col gap-2.5 rounded-2xl bg-white/60 p-3 transition-colors",
                      dragOverColumna === columna && "bg-white ring-2 ring-ink/15",
                    )}
                  >
                    <div className="flex items-center justify-between px-1">
                      <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-ink/65">
                        {SHIPPING_STATUS_LABEL[columna]}
                      </h3>
                      <span className="font-mono text-[10px] text-ink/65">
                        {enColumna.length}
                      </span>
                    </div>

                    {enColumna.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-ink/15 px-3 py-6 text-center font-mono text-[10px] uppercase tracking-widest text-ink/65">
                        Vacío
                      </p>
                    ) : (
                      enColumna.map((order) => (
                        <div
                          key={order.id}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData("text/plain", order.id);
                            event.dataTransfer.effectAllowed = "move";
                            setDraggingId(order.id);
                          }}
                          onDragEnd={() => setDraggingId(null)}
                          onClick={() => abrir(order)}
                          className={cn(
                            "cursor-grab rounded-xl bg-white p-3 text-left transition-opacity active:cursor-grabbing",
                            (draggingId === order.id || movingId === order.id) &&
                              "opacity-40",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[10px] font-medium">
                              {order.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span className="font-mono text-[10px] text-ink/65">
                              {formatDate(order.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1.5 truncate text-sm">
                            {order.customerName}
                          </p>
                          <p className="truncate font-mono text-[10px] text-ink/65">
                            {order.items.length}{" "}
                            {order.items.length === 1 ? "ítem" : "ítems"} ·{" "}
                            {formatPrice(order.total)}
                          </p>
                          {order.trackingCode && (
                            <p className="mt-1 truncate font-mono text-[10px] text-petroleo">
                              {order.trackingCode}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
      <AdminTable
        columns={[
          { label: "Orden" },
          { label: "Cliente" },
          { label: "Entrega", hideOnMobile: true },
          { label: "Total", align: "right" },
          { label: "Pago" },
          { label: "Envío", hideOnMobile: true },
        ]}
        isLoading={orders.isLoading}
        isEmpty={visibles.length === 0}
        empty={
          todas.length === 0
            ? "Todavía no entró ninguna orden."
            : enFecha.length === 0
              ? "No entró ninguna orden en ese período."
              : estado === "vencidas"
                ? `Ninguna reserva pasó las ${RESERVA_HORAS} h sin acreditarse.`
                : estado === "abandonados"
                  ? "Nadie se fue de Mercado Pago sin pagar."
                  : "Ninguna orden coincide con ese filtro."
        }
      >
        {visibles.map((order) => (
          <tr
            key={order.id}
            onClick={() => abrir(order)}
            className="cursor-pointer border-b border-ink/[0.06] transition-colors last:border-0 hover:bg-cream/60"
          >
            <td className="whitespace-nowrap px-4 py-3">
              <span className="block font-mono text-xs font-medium">
                {order.id.slice(0, 8).toUpperCase()}
              </span>
              <span className="font-mono text-[10px] text-ink/65">
                {formatDate(order.createdAt)}
              </span>
            </td>

            <td className="px-4 py-3">
              <span className="block max-w-[14rem] truncate text-sm">
                {order.customerName}
              </span>
              <span className="block max-w-[14rem] truncate font-mono text-[10px] text-ink/65">
                {order.customerEmail}
              </span>
            </td>

            <td className="hidden px-4 py-3 sm:table-cell">
              <span className="block font-mono text-[10px] uppercase tracking-widest text-ink/65">
                {SHIPPING_METHOD_LABEL[order.shippingMethod] ??
                  order.shippingMethod}
              </span>
              <span className="text-[11px] text-ink/65">
                {order.shippingMethod === "retiro"
                  ? "Retira en el depósito"
                  : order.shippingAddress?.provincia}
              </span>
            </td>

            <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs">
              {formatPrice(order.total)}
              <span className="block text-[10px] text-ink/65">
                {PAYMENT_LABEL[order.paymentMethod]}
              </span>
            </td>

            <td className="px-4 py-3">
              <StatusBadge kind="pago" value={order.status} />
              {/* "Pendiente" solo dice que no se cobró; lo que hay que hacer
                  está en hace cuánto entró y cómo iba a pagar */}
              {(() => {
                const stage = pendingStage(order);
                return stage ? (
                  <span
                    className={cn(
                      "mt-1 block font-mono text-[10px]",
                      // La vencida se destaca con peso y no con color: el
                      // naranja a 10px no llega al contraste mínimo (D10)
                      stage === "vencida"
                        ? "font-medium text-ink"
                        : "text-ink/65",
                    )}
                  >
                    {pendingNote(order, stage)}
                  </span>
                ) : null;
              })()}
            </td>

            <td className="hidden px-4 py-3 sm:table-cell">
              <StatusBadge kind="envio" value={order.shippingStatus} />
            </td>
          </tr>
        ))}
      </AdminTable>
      )}

      <AdminDrawer
        open={abierta !== null}
        onClose={() => {
          setAbierta(null);
          setPatch(null);
        }}
        wide
        title={abierta ? `Orden ${abierta.id.slice(0, 8).toUpperCase()}` : ""}
        subtitle={abierta ? formatDateTime(abierta.createdAt) : undefined}
        footer={
          <div className="flex gap-3">
            <Button
              className="flex-1 disabled:opacity-50"
              disabled={updateOrder.isPending}
              onClick={() => void guardar()}
            >
              {updateOrder.isPending ? "Guardando…" : "Guardar cambios ✦"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setAbierta(null);
                setPatch(null);
              }}
            >
              Cerrar
            </Button>
          </div>
        }
      >
        {abierta && patch && (
          <div className="space-y-7">
            <section>
              <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/65">
                Cliente
              </h3>
              <div className="rounded-xl bg-white p-4 text-sm leading-relaxed">
                <p className="font-semibold">{abierta.customerName}</p>
                <p className="font-mono text-xs text-ink/65">
                  {abierta.customerEmail}
                </p>
                {abierta.customerPhone && (
                  <p className="font-mono text-xs text-ink/65">
                    {abierta.customerPhone}
                  </p>
                )}
                {/* Las órdenes de retiro se guardan sin dirección: no se la pedimos. */}
                {abierta.shippingMethod === "retiro" ? (
                  <p className="mt-3 text-xs text-ink/70">
                    Retira en el depósito — no hay envío que despachar.
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-ink/70">
                    {abierta.shippingAddress?.direccion}
                    <br />
                    {abierta.shippingAddress?.ciudad},{" "}
                    {abierta.shippingAddress?.provincia} (CP{" "}
                    {abierta.shippingAddress?.cp})
                  </p>
                )}
                <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink/65">
                  {SHIPPING_METHOD_LABEL[abierta.shippingMethod] ??
                    abierta.shippingMethod}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  {whatsappLink(abierta) && (
                    <a
                      href={whatsappLink(abierta)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[10px] uppercase tracking-widest text-verde hover:underline"
                    >
                      Escribir por WhatsApp ↗
                    </a>
                  )}
                  <a
                    href={`mailto:${abierta.customerEmail}`}
                    className="font-mono text-[10px] uppercase tracking-widest text-ink/65 hover:text-ink"
                  >
                    Mandar mail ↗
                  </a>
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/65">
                Lo que pidió
              </h3>
              <ul className="divide-y divide-ink/[0.08] rounded-xl bg-white px-4">
                {abierta.items.map((item, index) => (
                  <li
                    key={`${item.slug}-${item.variant_id ?? index}`}
                    className="flex items-baseline justify-between gap-3 py-3 text-sm"
                  >
                    <span>
                      {item.qty}× {item.name}
                      {item.variant && (
                        <span className="text-ink/65"> · {item.variant}</span>
                      )}
                    </span>
                    <span className="whitespace-nowrap font-mono text-xs">
                      {formatPrice(item.price * item.qty)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-3 space-y-1.5 rounded-xl bg-white p-4 font-mono text-xs">
                <div className="flex justify-between">
                  <dt className="text-ink/65">Subtotal</dt>
                  <dd>{formatPrice(abierta.subtotal)}</dd>
                </div>
                {abierta.discount > 0 && (
                  <div className="flex justify-between gap-3 text-verde">
                    <dt>{abierta.discountLabel ?? "Descuento"}</dt>
                    <dd>−{formatPrice(abierta.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-ink/65">Envío</dt>
                  <dd>
                    {abierta.shippingCost
                      ? formatPrice(abierta.shippingCost)
                      : "Sin cargo"}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-ink/10 pt-2 text-sm font-medium">
                  <dt>Total</dt>
                  <dd>{formatPrice(abierta.total)}</dd>
                </div>
              </dl>

              {abierta.mpPaymentId && (
                <p className="mt-2 font-mono text-[10px] text-ink/65">
                  Pago de Mercado Pago #{abierta.mpPaymentId}
                </p>
              )}

              {abierta.customerNotes && (
                <div className="mt-3 rounded-xl bg-amarillo/25 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/65">
                    Nota del cliente
                  </p>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed">
                    {abierta.customerNotes}
                  </p>
                </div>
              )}
            </section>

            <section className="space-y-4 border-t border-ink/10 pt-5">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/65">
                Gestión
              </h3>

              {(() => {
                const stage = pendingStage(abierta);
                if (!stage) return null;
                const texto: Record<PendingStage, string> = {
                  reservada: `Transferencia sin acreditar. La reserva de ${RESERVA_HORAS} h vence el ${formatDateTime(reservaVence(abierta).toISOString())}, ${timeUntil(reservaVence(abierta))}.`,
                  vencida: `La reserva de ${RESERVA_HORAS} h venció ${timeAgo(reservaVence(abierta))} y el pago no llegó. Escribile antes de cancelarla: puede haber transferido y no haber mandado el comprobante.`,
                  pagando: `Salió a Mercado Pago ${timeAgo(abierta.createdAt)} y todavía no volvió el pago. Puede estar pagando ahora mismo.`,
                  abandonada: `Salió a Mercado Pago ${timeAgo(abierta.createdAt)} y nunca volvió. Tenés su mail y su WhatsApp acá arriba.`,
                };
                return (
                  <p className="rounded-xl bg-amarillo/25 p-4 text-xs leading-relaxed">
                    <span className="font-mono uppercase tracking-widest">
                      {PENDING_STAGE_LABEL[stage]}
                    </span>
                    <br />
                    {texto[stage]}
                  </p>
                );
              })()}

              <SelectField
                id="o-status"
                label="Estado del pago"
                value={patch.status}
                onChange={(event) =>
                  setPatch({
                    ...patch,
                    status: event.target.value as OrderStatus,
                  })
                }
              >
                {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map(
                  (value) => (
                    <option key={value} value={value}>
                      {ORDER_STATUS_LABEL[value]}
                    </option>
                  ),
                )}
              </SelectField>

              <SelectField
                id="o-shipping"
                label="Estado del envío"
                value={patch.shippingStatus}
                onChange={(event) =>
                  setPatch({
                    ...patch,
                    shippingStatus: event.target.value as ShippingStatus,
                  })
                }
              >
                {(Object.keys(SHIPPING_STATUS_LABEL) as ShippingStatus[]).map(
                  (value) => (
                    <option key={value} value={value}>
                      {SHIPPING_STATUS_LABEL[value]}
                    </option>
                  ),
                )}
              </SelectField>

              <TextField
                id="o-tracking"
                label="Código de seguimiento"
                placeholder="Andreani / Correo Argentino"
                value={patch.trackingCode}
                onChange={(event) =>
                  setPatch({ ...patch, trackingCode: event.target.value })
                }
              />

              <TextareaField
                id="o-notes"
                label="Notas internas"
                rows={3}
                placeholder="Lo que necesites recordar de este pedido."
                value={patch.adminNotes}
                onChange={(event) =>
                  setPatch({ ...patch, adminNotes: event.target.value })
                }
              />
            </section>
          </div>
        )}
      </AdminDrawer>
    </>
  );
}
