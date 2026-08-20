import { useMemo, useState } from "react";
import AdminTable from "../../components/admin/AdminTable";
import PageHeading from "../../components/admin/PageHeading";
import QueryError from "../../components/admin/QueryError";
import SaveBar from "../../components/admin/SaveBar";
import SettingsSection from "../../components/admin/SettingsSection";
import Toggle, { ToggleSwitch } from "../../components/admin/Toggle";
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
import { COMBO_CATEGORIES } from "../../lib/promos";
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

/** Precio de venta editable en el listado. Si costo + margen (y combo, si
 *  corresponde) sugieren un número distinto al que está cargado, aparece un
 *  aviso abajo con un solo click para usarlo — así queda claro qué se está
 *  aplicando y sobre qué precio, en vez de una columna aparte. */
function PriceCell({
  product,
  listPrice,
}: {
  product: AdminProduct;
  listPrice: number | null;
}) {
  const quickUpdate = useQuickUpdateProduct();
  const [value, setValue] = useState<string>(String(product.price));

  const commit = () => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setValue(String(product.price));
      return;
    }
    if (parsed === product.price) return;
    quickUpdate.mutate({ id: product.id, patch: { price: parsed } });
  };

  const usarSugerido = () => {
    if (listPrice === null) return;
    setValue(String(listPrice));
    quickUpdate.mutate({ id: product.id, patch: { price: listPrice } });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        type="number"
        min={0}
        step={100}
        aria-label={`Precio de venta de ${product.name}`}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        className={cn(
          "w-28 rounded-lg border bg-transparent px-2 py-1 text-right font-mono text-xs focus:border-ink focus:outline-none",
          quickUpdate.isPending ? "border-celeste" : "border-ink/20",
        )}
      />
      {listPrice !== null && listPrice !== product.price && (
        <button
          type="button"
          onClick={usarSugerido}
          title="Costo + margen (y el combo, si el producto ya viene en pack) sugieren este precio."
          className="whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-orange transition-colors hover:text-ink"
        >
          Sugerido {formatPrice(listPrice)} — usar ✦
        </button>
      )}
    </div>
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
      // El combo solo corre en almohadones: en individuales, "es paquete"
      // no cambia nada, así que ni se lo tenemos en cuenta acá.
      const comboAplica = COMBO_CATEGORIES.includes(product.category);
      const listPrice =
        cost === null
          ? null
          : computeListPrice(
              cost,
              marginPercent,
              comboAplica && product.isBundle,
              comboPercent,
            );
      const transferPrice =
        listPrice === null ? null : computeTransferPrice(listPrice, transferPercent);
      const profit = listPrice === null || cost === null ? null : listPrice - cost;
      return { product, cost, listPrice, transferPrice, profit, comboAplica };
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
                hint="2 o más almohadones. Los individuales no entran: ya se venden en set."
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
            { label: "Vendido en pack", align: "center", hideOnMobile: true },
            { label: "Costo", align: "right" },
            { label: "Precio de venta", align: "right" },
            { label: "Con transferencia", align: "right", hideOnMobile: true },
            { label: "Ganancia", align: "right", hideOnMobile: true },
          ]}
          isLoading={products.isLoading}
          isEmpty={filas.length === 0}
          empty="El catálogo está vacío."
        >
          {filas.map(({ product, listPrice, transferPrice, profit, comboAplica }) => (
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
                <ToggleSwitch
                  compact
                  checked={product.isBundle}
                  label={`${product.name} se vende en pack`}
                  title={
                    comboAplica
                      ? "Ya se vende empaquetado en 2 o más unidades (ej. 'set x2'): el 10% de combo se descuenta directo del precio sugerido, en vez de esperar a que el cliente sume una segunda unidad en el carrito."
                      : "Ya se vende empaquetado en 2 o más unidades (ej. 'set x2'). Es solo un dato del catálogo: los individuales no tienen descuento por combo, así que esto no cambia el precio sugerido."
                  }
                  onChange={(isBundle) =>
                    quickUpdate.mutate({
                      id: product.id,
                      patch: { isBundle },
                    })
                  }
                  className="inline-flex"
                />
              </td>

              <td className="px-4 py-3 text-right">
                <CostCell product={product} />
              </td>

              <td className="px-4 py-3 text-right">
                <PriceCell product={product} listPrice={listPrice} />
              </td>

              <td className="hidden whitespace-nowrap px-4 py-3 text-right font-mono text-xs sm:table-cell">
                {transferPrice === null ? "—" : formatPrice(transferPrice)}
              </td>

              <td className="hidden whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-verde sm:table-cell">
                {profit === null ? "—" : formatPrice(profit)}
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
      <p className="mt-3 max-w-2xl text-[11px] leading-relaxed text-ink/50">
        "Precio de venta" es el precio real, editable acá o en Productos.
        Cuando costo + margen sugieren un número distinto, aparece
        "Sugerido — usar" debajo para aplicarlo con un click. "Vendido en
        pack" es un dato del catálogo (el producto ya trae 2+ unidades); en
        almohadones también le descuenta el combo directo al precio sugerido,
        en individuales no cambia nada porque no tienen esa promo.
      </p>
    </>
  );
}
