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
  SHIPPING_METHOD_LABEL,
  SHIPPING_STATUS_LABEL,
  downloadCsv,
  errorMessage,
  formatCompactPrice,
  formatDate,
  formatDateTime,
  isPaid,
  orderRevenue,
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

const VISTAS = ["tabla", "kanban"] as const;
type Vista = (typeof VISTAS)[number];

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

  const estado = (searchParams.get("estado") ?? "todos") as OrderStatus | "todos";
  const vista = (searchParams.get("vista") ?? "tabla") as Vista;
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

  const visibles = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    return todas.filter((order) => {
      if (estado !== "todos" && order.status !== estado) return false;
      if (!term) return true;
      return (
        order.customerName.toLowerCase().includes(term) ||
        order.customerEmail.toLowerCase().includes(term) ||
        order.id.toLowerCase().startsWith(term) ||
        (order.trackingCode ?? "").toLowerCase().includes(term)
      );
    });
  }, [todas, estado, busqueda]);

  const totales = useMemo(() => {
    const pagadas = todas.filter(isPaid);
    return {
      facturado: pagadas.reduce((total, order) => total + orderRevenue(order), 0),
      pagadas: pagadas.length,
      pendientes: todas.filter((order) => order.status === "pending").length,
      porDespachar: pagadas.filter(
        (order) =>
          order.shippingStatus === "pendiente" ||
          order.shippingStatus === "preparando",
      ).length,
    };
  }, [todas]);

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
              "dz-ventas.csv",
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
          label="Facturado total"
          value={formatCompactPrice(totales.facturado)}
          hint="órdenes cobradas, sin el envío"
        />
        <StatCard label="Ventas cobradas" value={String(totales.pagadas)} />
        <StatCard
          label="Pendientes"
          value={String(totales.pendientes)}
          hint="esperan pago o confirmación"
        />
        <StatCard
          label="Por despachar"
          value={String(totales.porDespachar)}
          hint="cobradas y sin salir"
        />
      </div>

      <div className="mb-4 mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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
                estado === id ? "bg-ink text-cream" : "text-ink/55 hover:text-ink",
              )}
            >
              {id === "todos" ? "Todas" : ORDER_STATUS_LABEL[id]}
            </button>
          ))}
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
                vista === v ? "bg-ink text-cream" : "text-ink/55 hover:text-ink",
              )}
            >
              {v === "tabla" ? "Tabla" : "Kanban"}
            </button>
          ))}
        </div>
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
            <div className="rounded-2xl bg-white px-4 py-16 text-center font-mono text-xs uppercase tracking-widest text-ink/50">
              ✦ Cargando…
            </div>
          ) : kanbanOrders.length === 0 ? (
            <div className="rounded-2xl bg-white px-4 py-16 text-center text-sm text-ink/50">
              {todas.length === 0
                ? "Todavía no entró ninguna orden."
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
                      <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-ink/60">
                        {SHIPPING_STATUS_LABEL[columna]}
                      </h3>
                      <span className="font-mono text-[10px] text-ink/40">
                        {enColumna.length}
                      </span>
                    </div>

                    {enColumna.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-ink/15 px-3 py-6 text-center font-mono text-[10px] uppercase tracking-widest text-ink/30">
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
                            <span className="font-mono text-[10px] text-ink/40">
                              {formatDate(order.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1.5 truncate text-sm">
                            {order.customerName}
                          </p>
                          <p className="truncate font-mono text-[10px] text-ink/45">
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
              <span className="font-mono text-[10px] text-ink/40">
                {formatDate(order.createdAt)}
              </span>
            </td>

            <td className="px-4 py-3">
              <span className="block max-w-[14rem] truncate text-sm">
                {order.customerName}
              </span>
              <span className="block max-w-[14rem] truncate font-mono text-[10px] text-ink/40">
                {order.customerEmail}
              </span>
            </td>

            <td className="hidden px-4 py-3 sm:table-cell">
              <span className="block font-mono text-[10px] uppercase tracking-widest text-ink/55">
                {SHIPPING_METHOD_LABEL[order.shippingMethod] ??
                  order.shippingMethod}
              </span>
              <span className="text-[11px] text-ink/45">
                {order.shippingMethod === "retiro"
                  ? "Retira en el depósito"
                  : order.shippingAddress?.provincia}
              </span>
            </td>

            <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs">
              {formatPrice(order.total)}
              <span className="block text-[10px] text-ink/40">
                {PAYMENT_LABEL[order.paymentMethod]}
              </span>
            </td>

            <td className="px-4 py-3">
              <StatusBadge kind="pago" value={order.status} />
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
              <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">
                Cliente
              </h3>
              <div className="rounded-xl bg-white p-4 text-sm leading-relaxed">
                <p className="font-semibold">{abierta.customerName}</p>
                <p className="font-mono text-xs text-ink/60">
                  {abierta.customerEmail}
                </p>
                {abierta.customerPhone && (
                  <p className="font-mono text-xs text-ink/60">
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
                <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink/50">
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
                    className="font-mono text-[10px] uppercase tracking-widest text-ink/55 hover:text-ink"
                  >
                    Mandar mail ↗
                  </a>
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">
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
                        <span className="text-ink/55"> · {item.variant}</span>
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
                  <dt className="text-ink/55">Subtotal</dt>
                  <dd>{formatPrice(abierta.subtotal)}</dd>
                </div>
                {abierta.discount > 0 && (
                  <div className="flex justify-between gap-3 text-verde">
                    <dt>{abierta.discountLabel ?? "Descuento"}</dt>
                    <dd>−{formatPrice(abierta.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-ink/55">Envío</dt>
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
                <p className="mt-2 font-mono text-[10px] text-ink/45">
                  Pago de Mercado Pago #{abierta.mpPaymentId}
                </p>
              )}

              {abierta.customerNotes && (
                <div className="mt-3 rounded-xl bg-amarillo/25 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">
                    Nota del cliente
                  </p>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed">
                    {abierta.customerNotes}
                  </p>
                </div>
              )}
            </section>

            <section className="space-y-4 border-t border-ink/10 pt-5">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">
                Gestión
              </h3>

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
