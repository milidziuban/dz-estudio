import { useMemo, useState } from "react";
import AdminTable from "../../components/admin/AdminTable";
import PageHeading from "../../components/admin/PageHeading";
import QueryError from "../../components/admin/QueryError";
import SaveBar from "../../components/admin/SaveBar";
import SettingsSection from "../../components/admin/SettingsSection";
import StatCard from "../../components/admin/StatCard";
import StockDrawer, {
  DeltaText,
  type StockModo,
} from "../../components/admin/StockDrawer";
import Toggle from "../../components/admin/Toggle";
import TextField from "../../components/TextField";
import { useAdminOrders } from "../../hooks/useAdminOrders";
import { useAdminProducts } from "../../hooks/useAdminProducts";
import { useStockMovimientos } from "../../hooks/useStockMovimientos";
import { useSettingsDraft } from "../../hooks/useStoreSettings";
import { isPaid } from "../../lib/admin";
import {
  produccionDelMes,
  stockLineKey,
  stockLines,
  type StockLine,
} from "../../lib/admin-stats";
import { cn } from "../../lib/cn";
import type { DistributionLocation } from "../../types/admin";

export default function AdminDistribucion() {
  const distribucion = useSettingsDraft("distribucion");
  const products = useAdminProducts();
  const orders = useAdminOrders();
  const movimientos = useStockMovimientos();

  /** Línea abierta en el drawer y con qué formulario se abrió. */
  const [abierta, setAbierta] = useState<StockLine | null>(null);
  const [modo, setModo] = useState<StockModo>("produccion");

  const { locations, lowStockThreshold } = distribucion.value;

  /** Unidades cobradas que todavía no salieron del depósito, por línea
   *  (producto simple, o producto+variante si el producto tiene variantes). */
  const comprometido = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of (orders.data ?? []).filter(
      (o) =>
        isPaid(o) &&
        (o.shippingStatus === "pendiente" || o.shippingStatus === "preparando"),
    )) {
      for (const item of order.items) {
        const key = stockLineKey(item.slug, item.variant_id);
        map.set(key, (map.get(key) ?? 0) + item.qty);
      }
    }
    return map;
  }, [orders.data]);

  const catalogo = products.data ?? [];
  const lineas = useMemo(() => stockLines(catalogo), [catalogo]);
  const conControl = lineas.filter((line) => line.stock !== null);
  const bajos = conControl.filter(
    (line) => (line.stock ?? 0) <= lowStockThreshold,
  );
  const sinStock = lineas.filter(
    (line) => !line.productInStock || line.stock === 0,
  );
  const unidadesTotales = conControl.reduce(
    (total, line) => total + (line.stock ?? 0),
    0,
  );

  const producidas = useMemo(
    () => produccionDelMes(movimientos.data ?? []),
    [movimientos.data],
  );
  const producidasTotal = [...producidas.values()].reduce(
    (total, qty) => total + qty,
    0,
  );
  const mesActual = new Intl.DateTimeFormat("es-AR", { month: "long" }).format(
    new Date(),
  );

  // La línea del drawer se lee del catálogo fresco: así el stock del título
  // y el del formulario se actualizan después de cada movimiento.
  const lineaAbierta = abierta
    ? (lineas.find((line) => line.key === abierta.key) ?? abierta)
    : null;

  const abrir = (line: StockLine, siguiente: StockModo) => {
    setModo(siguiente);
    setAbierta(line);
  };

  const setLocation = (
    index: number,
    patch: Partial<DistributionLocation>,
  ) => {
    const next = [...locations];
    next[index] = { ...next[index], ...patch };
    distribucion.update({ ...distribucion.value, locations: next });
  };

  const saveBar = (
    <SaveBar
      dirty={distribucion.dirty}
      saved={distribucion.saved}
      saving={distribucion.saving}
      error={distribucion.error}
      onSave={() => void distribucion.save()}
      onReset={distribucion.reset}
    />
  );

  return (
    <>
      <PageHeading
        title={
          <>
            Centro de{" "}
            <em className="font-serif font-normal italic text-petroleo">
              distribución
            </em>
          </>
        }
        description="Desde dónde sale cada pedido, qué hay en stock, qué se cosió este mes y qué unidades ya están comprometidas."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Unidades en stock"
          value={unidadesTotales.toLocaleString("es-AR")}
          hint={`${conControl.length} productos con control`}
        />
        <StatCard
          label="Poco stock"
          value={String(bajos.length)}
          hint={`${lowStockThreshold} unidades o menos`}
        />
        <StatCard
          label="Sin venta"
          value={String(sinStock.length)}
          hint="apagados o en cero"
        />
        <StatCard
          label="Por despachar"
          value={String(
            [...comprometido.values()].reduce((total, qty) => total + qty, 0),
          )}
          hint="unidades cobradas sin salir"
        />
      </div>

      <div className="mt-3 space-y-3">
        <SettingsSection
          title="Depósitos y puntos de retiro"
          description="La dirección del punto de retiro es la que ve el cliente en el checkout y en la pantalla de gracias."
          footer={
            <>
              {saveBar}
              <button
                type="button"
                onClick={() =>
                  distribucion.update({
                    ...distribucion.value,
                    locations: [
                      ...locations,
                      {
                        id: `deposito-${Date.now()}`,
                        nombre: "",
                        direccion: "",
                        horario: "",
                        retiro: false,
                        principal: false,
                      },
                    ],
                  })
                }
                className="font-mono text-[10px] uppercase tracking-widest text-ink/65 transition-colors hover:text-ink"
              >
                + Agregar depósito
              </button>
            </>
          }
        >
          <ul className="space-y-4">
            {locations.map((location, index) => (
              <li key={location.id} className="rounded-xl bg-cream p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/65">
                    {location.principal ? "✦ Principal" : "Depósito"}
                  </p>
                  {locations.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        distribucion.update({
                          ...distribucion.value,
                          locations: locations.filter((_, i) => i !== index),
                        })
                      }
                      className="font-mono text-[10px] uppercase tracking-widest text-orange-ink transition-colors hover:text-ink"
                    >
                      Quitar
                    </button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    id={`d-nombre-${location.id}`}
                    label="Nombre"
                    value={location.nombre}
                    onChange={(event) =>
                      setLocation(index, { nombre: event.target.value })
                    }
                  />
                  <TextField
                    id={`d-horario-${location.id}`}
                    label="Horario"
                    placeholder="Lunes a viernes de 9 a 20"
                    value={location.horario}
                    onChange={(event) =>
                      setLocation(index, { horario: event.target.value })
                    }
                  />
                  <TextField
                    id={`d-direccion-${location.id}`}
                    label="Dirección"
                    className="sm:col-span-2"
                    value={location.direccion}
                    onChange={(event) =>
                      setLocation(index, { direccion: event.target.value })
                    }
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Toggle
                    label="Punto de retiro"
                    hint="El cliente puede pasar a buscar el pedido."
                    checked={location.retiro}
                    onChange={(retiro) => setLocation(index, { retiro })}
                  />
                  <Toggle
                    label="Depósito principal"
                    hint="Desde acá salen los envíos por defecto."
                    checked={location.principal}
                    onChange={(principal) => {
                      // Solo uno puede ser el principal
                      const next = locations.map((item, i) => ({
                        ...item,
                        principal: principal ? i === index : item.principal && i !== index,
                      }));
                      distribucion.update({
                        ...distribucion.value,
                        locations: next,
                      });
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </SettingsSection>

        <SettingsSection
          title="Aviso de poco stock"
          description="Debajo de esta cantidad, el producto aparece marcado en el listado y en el inicio."
          footer={saveBar}
        >
          <div className="max-w-xs">
            <TextField
              id="d-low-stock"
              label="Unidades"
              type="number"
              min={0}
              value={lowStockThreshold}
              onChange={(event) =>
                distribucion.update({
                  ...distribucion.value,
                  lowStockThreshold: Number(event.target.value) || 0,
                })
              }
            />
          </div>
        </SettingsSection>
      </div>

      <h2 className="mb-3 mt-8 font-mono text-xs font-medium uppercase tracking-[0.15em]">
        Producción de {mesActual}
      </h2>

      <div className="rounded-2xl bg-white p-5">
        {movimientos.error ? (
          <p className="text-sm text-ink/65">
            No se pudo leer el registro de producción.
          </p>
        ) : producidasTotal === 0 ? (
          <p className="text-sm text-ink/65">
            Todavía no se registró producción este mes. Se anota desde
            "+ Producción", en la tabla de abajo.
          </p>
        ) : (
          <>
            <p className="font-mono text-2xl font-medium tracking-tight">
              {producidasTotal.toLocaleString("es-AR")}{" "}
              <span className="text-sm font-normal text-ink/65">
                unidades cosidas
              </span>
            </p>
            <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {lineas
                .filter((line) => (producidas.get(line.key) ?? 0) > 0)
                .map((line) => (
                  <li
                    key={line.key}
                    className="flex items-baseline justify-between gap-3 border-b border-ink/[0.06] pb-2 text-sm last:border-0"
                  >
                    <span className="truncate">
                      {line.productName}
                      {line.variantLabel && (
                        <span className="text-ink/65"> · {line.variantLabel}</span>
                      )}
                    </span>
                    <DeltaText
                      delta={producidas.get(line.key) ?? 0}
                      className="text-xs"
                    />
                  </li>
                ))}
            </ul>
          </>
        )}
      </div>

      <h2 className="mb-3 mt-8 font-mono text-xs font-medium uppercase tracking-[0.15em]">
        Stock por producto
      </h2>

      {products.error ? (
        <QueryError error={products.error} what="el stock" />
      ) : (
        <AdminTable
          columns={[
            { label: "Producto" },
            { label: "SKU", hideOnMobile: true },
            { label: "En stock", align: "right" },
            { label: "Comprometido", align: "right" },
            { label: "Disponible", align: "right" },
            { label: "Movimientos", align: "right", hideOnMobile: true },
          ]}
          isLoading={products.isLoading}
          isEmpty={lineas.length === 0}
          empty="No hay productos cargados."
        >
          {lineas.map((line, index) => {
            const reservado = comprometido.get(line.key) ?? 0;
            const disponible =
              line.stock === null ? null : line.stock - reservado;
            const mismoProductoQueAnterior =
              lineas[index - 1]?.productId === line.productId;
            const nombre = line.variantLabel ?? line.productName;

            // Las dos puertas al stock. En pantallas chicas van debajo del
            // nombre, que es lo que queda a la vista sin scrollear la tabla.
            const acciones = (className: string) =>
              line.stock === null ? null : (
                <div className={cn("flex items-center gap-4", className)}>
                  <button
                    type="button"
                    onClick={() => abrir(line, "produccion")}
                    aria-label={`Registrar producción de ${nombre}`}
                    className="font-mono text-[10px] uppercase tracking-widest text-verde transition-opacity hover:opacity-70"
                  >
                    + Producción
                  </button>
                  <button
                    type="button"
                    onClick={() => abrir(line, "ajuste")}
                    aria-label={`Ajustar el stock de ${nombre}`}
                    className="font-mono text-[10px] uppercase tracking-widest text-ink/65 transition-colors hover:text-ink"
                  >
                    Ajustar a…
                  </button>
                </div>
              );

            return (
              <tr
                key={line.key}
                className="border-b border-ink/[0.06] last:border-0"
              >
                <td className="px-4 py-3">
                  {line.variantId ? (
                    <>
                      {!mismoProductoQueAnterior && (
                        <span className="block max-w-[16rem] truncate text-sm">
                          {line.productName}
                        </span>
                      )}
                      <span className="font-mono text-[10px] uppercase tracking-widest text-ink/65">
                        {mismoProductoQueAnterior ? "↳ " : ""}
                        {line.variantLabel}
                        {!line.productInStock && " · apagado"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="block max-w-[16rem] truncate text-sm">
                        {line.productName}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-ink/65">
                        {line.category}
                        {!line.productInStock && " · apagado"}
                      </span>
                    </>
                  )}
                  {acciones("mt-2 sm:hidden")}
                </td>
                <td className="hidden px-4 py-3 font-mono text-[11px] text-ink/65 sm:table-cell">
                  {line.sku ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {line.stock === null ? (
                    <span className="font-mono text-xs text-ink/65">
                      Sin control
                    </span>
                  ) : (
                    // El número ya no se edita acá: se mueve con las acciones
                    // de la derecha y queda anotado. Tocarlo abre el historial.
                    <button
                      type="button"
                      onClick={() => abrir(line, "produccion")}
                      aria-label={`Historial de stock de ${nombre}`}
                      className="font-mono text-sm tabular-nums underline decoration-ink/25 decoration-dotted underline-offset-4 transition-colors hover:decoration-ink"
                    >
                      {line.stock}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-ink/65">
                  {reservado || "—"}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-right font-mono text-xs",
                    disponible !== null &&
                      disponible <= lowStockThreshold &&
                      "text-orange-ink",
                  )}
                >
                  {disponible === null ? "—" : disponible}
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-right sm:table-cell">
                  {acciones("justify-end") ?? (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
                      —
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </AdminTable>
      )}

      <StockDrawer
        line={lineaAbierta}
        modo={modo}
        onModoChange={setModo}
        onClose={() => setAbierta(null)}
        movimientos={movimientos.data ?? []}
        isLoading={movimientos.isLoading}
        error={movimientos.error}
      />
    </>
  );
}
