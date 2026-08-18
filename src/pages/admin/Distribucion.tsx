import { useMemo } from "react";
import AdminTable from "../../components/admin/AdminTable";
import PageHeading from "../../components/admin/PageHeading";
import QueryError from "../../components/admin/QueryError";
import SaveBar from "../../components/admin/SaveBar";
import SettingsSection from "../../components/admin/SettingsSection";
import StatCard from "../../components/admin/StatCard";
import StockCell from "../../components/admin/StockCell";
import Toggle from "../../components/admin/Toggle";
import TextField from "../../components/TextField";
import { useAdminOrders } from "../../hooks/useAdminOrders";
import {
  useAdminProducts,
  useQuickUpdateProduct,
  useQuickUpdateVariantStock,
} from "../../hooks/useAdminProducts";
import { useSettingsDraft } from "../../hooks/useStoreSettings";
import { isPaid } from "../../lib/admin";
import { stockLineKey, stockLines } from "../../lib/admin-stats";
import { cn } from "../../lib/cn";
import type { DistributionLocation } from "../../types/admin";

export default function AdminDistribucion() {
  const distribucion = useSettingsDraft("distribucion");
  const products = useAdminProducts();
  const orders = useAdminOrders();
  const quickUpdate = useQuickUpdateProduct();
  const quickUpdateVariant = useQuickUpdateVariantStock();

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
        description="Desde dónde sale cada pedido, qué hay en stock y qué unidades ya están comprometidas."
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
                className="font-mono text-[10px] uppercase tracking-widest text-ink/55 transition-colors hover:text-ink"
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
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">
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
                      className="font-mono text-[10px] uppercase tracking-widest text-orange/70 transition-colors hover:text-orange"
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
                    placeholder="Lunes a viernes de 9 a 18"
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
            const pendiente =
              (line.variantId
                ? quickUpdateVariant.isPending
                : quickUpdate.isPending) || false;

            const commitStock = (next: number) => {
              if (line.variantId) {
                quickUpdateVariant.mutate({
                  productId: line.productId,
                  variantId: line.variantId,
                  stock: next,
                });
              } else {
                quickUpdate.mutate({
                  id: line.productId,
                  patch: { stock: next },
                });
              }
            };

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
                      <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
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
                      <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
                        {line.category}
                        {!line.productInStock && " · apagado"}
                      </span>
                    </>
                  )}
                </td>
                <td className="hidden px-4 py-3 font-mono text-[11px] text-ink/55 sm:table-cell">
                  {line.sku ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {line.stock === null ? (
                    <span className="font-mono text-xs text-ink/40">
                      Sin control
                    </span>
                  ) : (
                    <StockCell
                      value={line.stock}
                      pending={pendiente}
                      ariaLabel={`Stock de ${line.variantLabel ?? line.productName}`}
                      onCommit={commitStock}
                    />
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-ink/55">
                  {reservado || "—"}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-right font-mono text-xs",
                    disponible !== null &&
                      disponible <= lowStockThreshold &&
                      "text-orange",
                  )}
                >
                  {disponible === null ? "—" : disponible}
                </td>
              </tr>
            );
          })}
        </AdminTable>
      )}
    </>
  );
}
