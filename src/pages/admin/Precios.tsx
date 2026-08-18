import { useMemo, useState } from "react";
import AdminTable from "../../components/admin/AdminTable";
import PageHeading from "../../components/admin/PageHeading";
import QueryError from "../../components/admin/QueryError";
import SaveBar from "../../components/admin/SaveBar";
import SettingsSection from "../../components/admin/SettingsSection";
import Toggle from "../../components/admin/Toggle";
import TextField from "../../components/TextField";
import {
  useAdminProducts,
  useQuickUpdateProduct,
} from "../../hooks/useAdminProducts";
import {
  SETTINGS_DEFAULTS,
  useSettingsDraft,
} from "../../hooks/useStoreSettings";
import { cn } from "../../lib/cn";
import { formatPrice } from "../../lib/format";
import { computeListPrice, computeTransferPrice } from "../../lib/pricing";
import type { AdminProduct } from "../../types/admin";

/** Costo unitario editable en el listado: es el dato que más se ajusta,
 *  no vale la pena abrir la ficha completa para eso. */
function CostCell({ product }: { product: AdminProduct }) {
  const quickUpdate = useQuickUpdateProduct();
  const [value, setValue] = useState<string>(
    product.cost === null ? "" : String(product.cost),
  );

  const commit = () => {
    if (value === "") {
      if (product.cost === null) return;
      quickUpdate.mutate({ id: product.id, patch: { cost: null } });
      return;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setValue(product.cost === null ? "" : String(product.cost));
      return;
    }
    if (parsed === product.cost) return;
    quickUpdate.mutate({ id: product.id, patch: { cost: parsed } });
  };

  return (
    <input
      type="number"
      min={0}
      step={10}
      placeholder="Sin cargar"
      aria-label={`Costo unitario de ${product.name}`}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      className={cn(
        "w-24 rounded-lg border bg-transparent px-2 py-1 text-right font-mono text-xs focus:border-ink focus:outline-none",
        quickUpdate.isPending ? "border-celeste" : "border-ink/20",
      )}
    />
  );
}

export default function AdminPrecios() {
  const products = useAdminProducts();
  const quickUpdate = useQuickUpdateProduct();
  const precios = useSettingsDraft("precios");
  const marketing = useSettingsDraft("marketing");

  const promos = marketing.value.promos ?? SETTINGS_DEFAULTS.marketing.promos;
  const marginPercent = precios.value.marginPercent;
  const comboPercent = promos.combo.percent;
  const transferPercent = promos.transferencia.percent;

  const filas = useMemo(() => {
    return (products.data ?? []).map((product) => {
      const cost = product.cost;
      const listPrice =
        cost === null
          ? null
          : computeListPrice(cost, marginPercent, product.isBundle, comboPercent);
      const transferPrice =
        listPrice === null ? null : computeTransferPrice(listPrice, transferPercent);
      const profit = listPrice === null || cost === null ? null : listPrice - cost;
      return { product, cost, listPrice, transferPrice, profit };
    });
  }, [products.data, marginPercent, comboPercent, transferPercent]);

  return (
    <>
      <PageHeading
        title={
          <>
            Precios y{" "}
            <em className="font-serif font-normal italic text-orange">
              márgenes
            </em>
          </>
        }
        description="La misma cuenta que la planilla: costo + margen te da el precio de lista, y de ahí salen el precio con transferencia y la ganancia por venta."
      />

      <div className="space-y-3">
        <SettingsSection
          title="Margen de ganancia"
          description="Se aplica sobre el costo de cada producto para sugerir el precio de lista de abajo."
          footer={
            <SaveBar
              dirty={precios.dirty}
              saved={precios.saved}
              saving={precios.saving}
              error={precios.error}
              onSave={() => void precios.save()}
              onReset={precios.reset}
            />
          }
        >
          <TextField
            id="precios-margin"
            label="Margen sobre el costo %"
            type="number"
            min={0}
            className="max-w-xs"
            value={marginPercent}
            onChange={(event) =>
              precios.update({
                marginPercent: Number(event.target.value) || 0,
              })
            }
          />
          <p className="mt-3 text-[11px] leading-relaxed text-ink/50">
            100% = el precio de lista duplica el costo.
          </p>
        </SettingsSection>

        <SettingsSection
          title="Descuentos automáticos"
          description="Los mismos que corren solos en el carrito (se editan acá, es la única copia). No se combinan entre sí: se aplica el que más le conviene al cliente."
          footer={
            <SaveBar
              dirty={marketing.dirty}
              saved={marketing.saved}
              saving={marketing.saving}
              error={marketing.error}
              onSave={() => void marketing.save()}
              onReset={marketing.reset}
            />
          }
        >
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <Toggle
                label="Descuento por combo"
                hint="2 o más del mismo producto (almohadones o individuales)."
                checked={promos.combo.enabled}
                onChange={(enabled) =>
                  marketing.update({
                    ...marketing.value,
                    promos: { ...promos, combo: { ...promos.combo, enabled } },
                  })
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  id="promo-combo-percent"
                  label="Descuento %"
                  type="number"
                  min={1}
                  max={100}
                  value={promos.combo.percent}
                  onChange={(event) =>
                    marketing.update({
                      ...marketing.value,
                      promos: {
                        ...promos,
                        combo: {
                          ...promos.combo,
                          percent: Number(event.target.value) || 0,
                        },
                      },
                    })
                  }
                />
                <TextField
                  id="promo-combo-qty"
                  label="Desde (unidades)"
                  type="number"
                  min={2}
                  value={promos.combo.minQty}
                  onChange={(event) =>
                    marketing.update({
                      ...marketing.value,
                      promos: {
                        ...promos,
                        combo: {
                          ...promos.combo,
                          minQty: Number(event.target.value) || 2,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <Toggle
                label="Descuento por transferencia"
                hint="Se aplica sobre el subtotal cuando el cliente elige transferencia."
                checked={promos.transferencia.enabled}
                onChange={(enabled) =>
                  marketing.update({
                    ...marketing.value,
                    promos: {
                      ...promos,
                      transferencia: { ...promos.transferencia, enabled },
                    },
                  })
                }
              />
              <TextField
                id="promo-transfer-percent"
                label="Descuento %"
                type="number"
                min={1}
                max={100}
                value={promos.transferencia.percent}
                onChange={(event) =>
                  marketing.update({
                    ...marketing.value,
                    promos: {
                      ...promos,
                      transferencia: {
                        ...promos.transferencia,
                        percent: Number(event.target.value) || 0,
                      },
                    },
                  })
                }
              />
            </div>
          </div>
        </SettingsSection>
      </div>

      <h2 className="mb-3 mt-8 font-mono text-xs font-medium uppercase tracking-[0.15em]">
        Productos
      </h2>

      {products.error ? (
        <QueryError error={products.error} what="el catálogo" />
      ) : (
        <AdminTable
          columns={[
            { label: "Producto" },
            { label: "Es paquete", align: "center", hideOnMobile: true },
            { label: "Costo", align: "right" },
            { label: "Precio de lista", align: "right" },
            { label: "Precio actual", align: "right", hideOnMobile: true },
            { label: "Con transferencia", align: "right", hideOnMobile: true },
            { label: "Ganancia", align: "right", hideOnMobile: true },
            { label: "", align: "right" },
          ]}
          isLoading={products.isLoading}
          isEmpty={filas.length === 0}
          empty="El catálogo está vacío."
        >
          {filas.map(({ product, listPrice, transferPrice, profit }) => (
            <tr
              key={product.id}
              className="border-b border-ink/[0.06] last:border-0"
            >
              <td className="px-4 py-3">
                <span className="block max-w-[14rem] truncate text-sm font-semibold">
                  {product.name}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
                  {product.category}
                </span>
              </td>

              <td className="hidden px-4 py-3 text-center sm:table-cell">
                <button
                  type="button"
                  role="switch"
                  aria-checked={product.isBundle}
                  aria-label={`${product.name} es paquete`}
                  title="Ya se vende empaquetado (ej. pack x2): el descuento por combo se le aplica directo al precio de lista."
                  onClick={() =>
                    quickUpdate.mutate({
                      id: product.id,
                      patch: { isBundle: !product.isBundle },
                    })
                  }
                  className={cn(
                    "relative inline-block h-5 w-9 rounded-full transition-colors",
                    product.isBundle ? "bg-verde" : "bg-ink/20",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-1 h-3 w-3 rounded-full bg-white transition-transform",
                      product.isBundle ? "translate-x-5" : "translate-x-1",
                    )}
                  />
                </button>
              </td>

              <td className="px-4 py-3 text-right">
                <CostCell product={product} />
              </td>

              <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs">
                {listPrice === null ? (
                  <span className="text-ink/40">Cargá el costo</span>
                ) : (
                  formatPrice(listPrice)
                )}
              </td>

              <td className="hidden whitespace-nowrap px-4 py-3 text-right font-mono text-xs sm:table-cell">
                {formatPrice(product.price)}
              </td>

              <td className="hidden whitespace-nowrap px-4 py-3 text-right font-mono text-xs sm:table-cell">
                {transferPrice === null ? "—" : formatPrice(transferPrice)}
              </td>

              <td className="hidden whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-verde sm:table-cell">
                {profit === null ? "—" : formatPrice(profit)}
              </td>

              <td className="whitespace-nowrap px-4 py-3 text-right">
                <button
                  type="button"
                  disabled={
                    listPrice === null ||
                    listPrice === product.price ||
                    quickUpdate.isPending
                  }
                  onClick={() =>
                    quickUpdate.mutate({
                      id: product.id,
                      patch: { price: listPrice ?? undefined },
                    })
                  }
                  className="font-mono text-[10px] uppercase tracking-widest text-ink/55 transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-ink/55"
                >
                  Aplicar ✦
                </button>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
      <p className="mt-3 max-w-2xl text-[11px] leading-relaxed text-ink/50">
        "Aplicar" escribe el precio de lista calculado como el precio de venta
        real del producto (el mismo campo que se edita en Productos).
      </p>
    </>
  );
}
