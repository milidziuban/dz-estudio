import { useMemo, useState } from "react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import AdminTable from "../../components/admin/AdminTable";
import PageHeading from "../../components/admin/PageHeading";
import QueryError from "../../components/admin/QueryError";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import Button from "../../components/Button";
import { useAdminOrders } from "../../hooks/useAdminOrders";
import {
  PAYMENT_LABEL,
  downloadCsv,
  formatCompactPrice,
  formatDate,
} from "../../lib/admin";
import { customersFromOrders } from "../../lib/admin-stats";
import { formatPrice } from "../../lib/format";
import type { Customer } from "../../types/admin";

export default function AdminClientes() {
  const orders = useAdminOrders();
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState<Customer | null>(null);

  const todos = useMemo(
    () => customersFromOrders(orders.data ?? []),
    [orders.data],
  );

  const visibles = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return todos;
    return todos.filter(
      (customer) =>
        customer.email.includes(term) ||
        customer.nombre.toLowerCase().includes(term) ||
        customer.provincia.toLowerCase().includes(term),
    );
  }, [todos, busqueda]);

  const resumen = useMemo(() => {
    const compradores = todos.filter((customer) => customer.paidCount > 0);
    const recurrentes = compradores.filter(
      (customer) => customer.paidCount > 1,
    );
    const gastado = compradores.reduce(
      (total, customer) => total + customer.totalSpent,
      0,
    );
    return {
      total: todos.length,
      compradores: compradores.length,
      recurrentes: recurrentes.length,
      promedio: compradores.length
        ? Math.round(gastado / compradores.length)
        : 0,
    };
  }, [todos]);

  /** Órdenes del cliente abierto en el panel lateral. */
  const ordenesDelCliente = useMemo(() => {
    if (!abierto) return [];
    return (orders.data ?? []).filter(
      (order) => order.customerEmail.trim().toLowerCase() === abierto.email,
    );
  }, [orders.data, abierto]);

  if (orders.error) {
    return (
      <>
        <PageHeading title="Clientes" />
        <QueryError error={orders.error} what="los clientes" />
      </>
    );
  }

  return (
    <>
      <PageHeading
        title={
          <>
            Quién{" "}
            <em className="font-serif font-normal italic text-pink">compra</em>
          </>
        }
        description="La lista sale de las órdenes: cada email es un cliente, con lo que gastó y cuándo fue la última vez."
      >
        <Button
          variant="secondary"
          className="px-5 py-2.5"
          onClick={() =>
            downloadCsv(
              "dz-clientes.csv",
              visibles.map((customer) => ({
                Nombre: customer.nombre,
                Email: customer.email,
                Telefono: customer.telefono ?? "",
                Ciudad: customer.ciudad,
                Provincia: customer.provincia,
                Ordenes: customer.ordersCount,
                Cobradas: customer.paidCount,
                Total_comprado_sin_envio: customer.totalSpent,
                Primera_compra: formatDate(customer.firstOrderAt),
                Ultima_compra: formatDate(customer.lastOrderAt),
              })),
            )
          }
        >
          Bajar CSV
        </Button>
      </PageHeading>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Clientes"
          value={String(resumen.total)}
          hint={`${resumen.compradores} con compra cobrada`}
        />
        <StatCard
          label="Recurrentes"
          value={String(resumen.recurrentes)}
          hint="compraron más de una vez"
        />
        <StatCard
          label="Compra promedio"
          value={resumen.promedio ? formatCompactPrice(resumen.promedio) : "—"}
          hint="por cliente, sin el envío"
        />
        <StatCard
          label="Mejor cliente"
          value={
            visibles[0]?.totalSpent
              ? formatCompactPrice(visibles[0].totalSpent)
              : "—"
          }
          hint={todos[0]?.nombre}
        />
      </div>

      <div className="mb-4 mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar por nombre, email o provincia"
          aria-label="Buscar clientes"
          className="w-full rounded-full border border-ink/20 bg-white px-5 py-2.5 font-mono text-xs focus:border-ink focus:outline-none sm:max-w-sm"
        />
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45 sm:ml-auto">
          {visibles.length} {visibles.length === 1 ? "cliente" : "clientes"}
        </p>
      </div>

      <AdminTable
        columns={[
          { label: "Cliente" },
          { label: "Dónde", hideOnMobile: true },
          { label: "Órdenes", align: "right" },
          { label: "Compró", align: "right" },
          { label: "Última", align: "right", hideOnMobile: true },
        ]}
        isLoading={orders.isLoading}
        isEmpty={visibles.length === 0}
        empty={
          todos.length === 0
            ? "Todavía no hay clientes: aparecen cuando entra la primera orden."
            : "Nadie coincide con esa búsqueda."
        }
      >
        {visibles.map((customer) => (
          <tr
            key={customer.email}
            onClick={() => setAbierto(customer)}
            className="cursor-pointer border-b border-ink/[0.06] transition-colors last:border-0 hover:bg-cream/60"
          >
            <td className="px-4 py-3">
              <span className="block max-w-[15rem] truncate text-sm">
                {customer.nombre}
              </span>
              <span className="block max-w-[15rem] truncate font-mono text-[10px] text-ink/40">
                {customer.email}
              </span>
            </td>
            <td className="hidden px-4 py-3 text-xs text-ink/60 sm:table-cell">
              {customer.ciudad ? `${customer.ciudad}, ` : ""}
              {customer.provincia || "—"}
            </td>
            <td className="px-4 py-3 text-right font-mono text-xs">
              {customer.paidCount}
              {customer.ordersCount !== customer.paidCount && (
                <span className="text-ink/40"> / {customer.ordersCount}</span>
              )}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs">
              {customer.totalSpent ? formatPrice(customer.totalSpent) : "—"}
            </td>
            <td className="hidden whitespace-nowrap px-4 py-3 text-right font-mono text-[11px] text-ink/55 sm:table-cell">
              {formatDate(customer.lastOrderAt)}
            </td>
          </tr>
        ))}
      </AdminTable>

      <AdminDrawer
        open={abierto !== null}
        onClose={() => setAbierto(null)}
        title={abierto?.nombre ?? ""}
        subtitle={abierto?.email}
      >
        {abierto && (
          <div className="space-y-7">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50">
                  Compró
                </p>
                <p className="mt-1 font-mono text-lg">
                  {formatPrice(abierto.totalSpent)}
                </p>
                <p className="mt-1 text-[10px] text-ink/45">sin el envío</p>
              </div>
              <div className="rounded-xl bg-white p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50">
                  Compras
                </p>
                <p className="mt-1 font-mono text-lg">{abierto.paidCount}</p>
              </div>
            </div>

            <section className="rounded-xl bg-white p-4 text-sm leading-relaxed">
              {abierto.telefono && (
                <p className="font-mono text-xs text-ink/60">
                  {abierto.telefono}
                </p>
              )}
              <p className="text-xs text-ink/70">
                {abierto.ciudad}
                {abierto.ciudad && abierto.provincia ? ", " : ""}
                {abierto.provincia}
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink/45">
                Cliente desde {formatDate(abierto.firstOrderAt)}
              </p>
              <a
                href={`mailto:${abierto.email}`}
                className="mt-3 inline-block font-mono text-[10px] uppercase tracking-widest text-ink/55 hover:text-ink"
              >
                Mandar mail ↗
              </a>
            </section>

            <section>
              <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">
                Sus órdenes
              </h3>
              <ul className="divide-y divide-ink/[0.08] rounded-xl bg-white px-4">
                {ordenesDelCliente.map((order) => (
                  <li key={order.id} className="py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-mono text-xs">
                        {order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="font-mono text-xs">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <StatusBadge kind="pago" value={order.status} />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
                        {formatDate(order.createdAt)} ·{" "}
                        {PAYMENT_LABEL[order.paymentMethod]}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-ink/60">
                      {order.items
                        .map((item) => `${item.qty}× ${item.name}`)
                        .join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </AdminDrawer>
    </>
  );
}
