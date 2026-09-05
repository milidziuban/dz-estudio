import { useState } from "react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import AdminTable from "../../components/admin/AdminTable";
import PageHeading from "../../components/admin/PageHeading";
import QueryError from "../../components/admin/QueryError";
import Toggle, { ToggleSwitch } from "../../components/admin/Toggle";
import Button from "../../components/Button";
import SelectField from "../../components/SelectField";
import TextField from "../../components/TextField";
import {
  draftFromDiscount,
  emptyDiscountDraft,
  useDeleteDiscount,
  useDiscounts,
  useSaveDiscount,
  useToggleDiscount,
  type DiscountDraft,
} from "../../hooks/useDiscounts";
import { errorMessage, formatDate } from "../../lib/admin";
import { formatPrice } from "../../lib/format";
import type { Discount, DiscountKind } from "../../types/admin";

const KIND_LABEL: Record<DiscountKind, string> = {
  percent: "Porcentaje",
  fixed: "Monto fijo",
  "free-shipping": "Envío gratis",
};

function valorDelCupon(discount: Discount): string {
  if (discount.kind === "free-shipping") return "Envío gratis";
  if (discount.kind === "percent") return `${discount.value}%`;
  return formatPrice(discount.value);
}

/** Un cupón está vigente si está activo, en fecha y con usos disponibles. */
function vigente(discount: Discount): boolean {
  if (!discount.active) return false;
  const now = Date.now();
  if (discount.startsAt && new Date(discount.startsAt).getTime() > now)
    return false;
  if (discount.endsAt && new Date(discount.endsAt).getTime() < now) return false;
  if (discount.maxUses !== null && discount.uses >= discount.maxUses)
    return false;
  return true;
}

export default function AdminDescuentos() {
  const discounts = useDiscounts();
  const saveDiscount = useSaveDiscount();
  const toggleDiscount = useToggleDiscount();
  const deleteDiscount = useDeleteDiscount();

  const [draft, setDraft] = useState<DiscountDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const guardarCupon = async () => {
    if (!draft) return;
    setFormError(null);
    if (!draft.code.trim()) {
      setFormError("Falta el código del cupón");
      return;
    }
    if (draft.kind !== "free-shipping" && draft.value <= 0) {
      setFormError("El valor tiene que ser mayor a cero");
      return;
    }
    if (draft.kind === "percent" && draft.value > 100) {
      setFormError("Un porcentaje no puede pasar de 100");
      return;
    }
    try {
      await saveDiscount.mutateAsync(draft);
      setDraft(null);
    } catch (error) {
      setFormError(
        errorMessage(error, "No se pudo guardar el cupón"),
      );
    }
  };

  return (
    <>
      <PageHeading
        title={
          <>
            Descuentos y{" "}
            <em className="font-serif font-normal italic text-orange">
              promociones
            </em>
          </>
        }
        description="Los cupones con código. Las dos promos automáticas (combo y transferencia) se editan en Precios."
      />

      <p className="mb-6 rounded-xl bg-cream px-4 py-3 text-xs leading-relaxed text-ink/65">
        ✦ El descuento por combo y el de transferencia son los que ya corren
        solos en el carrito. Se mudaron a{" "}
        <a href="/admin/precios" className="font-semibold underline">
          Precios
        </a>
        , junto con el margen y el costo de cada producto.
      </p>

      <div className="mb-3 mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-mono text-xs font-medium uppercase tracking-[0.15em]">
            Cupones con código
          </h2>
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-ink/65">
            ✧ Los cupones se guardan y se administran acá, pero el checkout
            todavía no tiene el campo para canjearlos: por ahora sirven para
            tenerlos definidos y aplicarlos a mano sobre el total.
          </p>
        </div>
        <Button
          className="px-6 py-3"
          onClick={() => {
            setFormError(null);
            setDraft(emptyDiscountDraft());
          }}
        >
          + Nuevo cupón
        </Button>
      </div>

      {discounts.error ? (
        <QueryError error={discounts.error} what="los cupones" />
      ) : (
        <AdminTable
          columns={[
            { label: "Código" },
            { label: "Beneficio" },
            { label: "Mínimo", align: "right", hideOnMobile: true },
            { label: "Usos", align: "right" },
            { label: "Vigencia", hideOnMobile: true },
            { label: "Activo", align: "center" },
            { label: "", align: "right" },
          ]}
          isLoading={discounts.isLoading}
          isEmpty={(discounts.data ?? []).length === 0}
          empty="Todavía no hay cupones."
        >
          {(discounts.data ?? []).map((discount) => (
            <tr
              key={discount.id}
              className="border-b border-ink/[0.06] last:border-0"
            >
              <td className="px-4 py-3">
                <span className="block font-mono text-xs font-medium uppercase tracking-widest">
                  {discount.code}
                </span>
                {discount.description && (
                  <span className="block max-w-[14rem] truncate text-[11px] text-ink/65">
                    {discount.description}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                {valorDelCupon(discount)}
                <span className="block font-mono text-[10px] uppercase tracking-widest text-ink/65">
                  {KIND_LABEL[discount.kind]}
                </span>
              </td>
              <td className="hidden whitespace-nowrap px-4 py-3 text-right font-mono text-xs sm:table-cell">
                {discount.minSubtotal ? formatPrice(discount.minSubtotal) : "—"}
              </td>
              <td className="px-4 py-3 text-right font-mono text-xs">
                {discount.uses}
                {discount.maxUses !== null && (
                  <span className="text-ink/65"> / {discount.maxUses}</span>
                )}
              </td>
              <td className="hidden whitespace-nowrap px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-ink/65 sm:table-cell">
                {discount.startsAt || discount.endsAt ? (
                  <>
                    {discount.startsAt ? formatDate(discount.startsAt) : "hoy"}
                    {" → "}
                    {discount.endsAt ? formatDate(discount.endsAt) : "sin fin"}
                  </>
                ) : (
                  "Siempre"
                )}
                {!vigente(discount) && (
                  <span className="block text-orange">No vigente</span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <ToggleSwitch
                  compact
                  checked={discount.active}
                  label={`Cupón ${discount.code} activo`}
                  onChange={(active) =>
                    toggleDiscount.mutate({ id: discount.id, active })
                  }
                  className="inline-flex"
                />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => {
                    setFormError(null);
                    setDraft(draftFromDiscount(discount));
                  }}
                  className="font-mono text-[10px] uppercase tracking-widest text-ink/65 transition-colors hover:text-ink"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(`¿Borrar el cupón ${discount.code}?`)
                    ) {
                      deleteDiscount.mutate(discount.id);
                    }
                  }}
                  className="ml-3 font-mono text-[10px] uppercase tracking-widest text-orange/70 transition-colors hover:text-orange"
                >
                  Borrar
                </button>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <AdminDrawer
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Editar cupón" : "Nuevo cupón"}
        footer={
          <div className="space-y-3">
            {formError && (
              <p role="alert" className="text-xs font-semibold text-orange">
                ✕ {formError}
              </p>
            )}
            <div className="flex gap-3">
              <Button
                className="flex-1 disabled:opacity-50"
                disabled={saveDiscount.isPending}
                onClick={() => void guardarCupon()}
              >
                {saveDiscount.isPending ? "Guardando…" : "Guardar ✦"}
              </Button>
              <Button variant="secondary" onClick={() => setDraft(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        }
      >
        {draft && (
          <div className="space-y-4">
            <TextField
              id="d-code"
              label="Código"
              placeholder="VERANO26"
              value={draft.code}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  code: event.target.value.toUpperCase().replace(/\s/g, ""),
                })
              }
            />
            <TextField
              id="d-description"
              label="Descripción interna"
              placeholder="Para la newsletter de febrero"
              value={draft.description}
              onChange={(event) =>
                setDraft({ ...draft, description: event.target.value })
              }
            />

            <SelectField
              id="d-kind"
              label="Tipo"
              value={draft.kind}
              onChange={(event) =>
                setDraft({ ...draft, kind: event.target.value as DiscountKind })
              }
            >
              {(Object.keys(KIND_LABEL) as DiscountKind[]).map((kind) => (
                <option key={kind} value={kind}>
                  {KIND_LABEL[kind]}
                </option>
              ))}
            </SelectField>

            {draft.kind !== "free-shipping" && (
              <TextField
                id="d-value"
                label={draft.kind === "percent" ? "Descuento %" : "Monto (ARS)"}
                type="number"
                min={1}
                max={draft.kind === "percent" ? 100 : undefined}
                value={draft.value}
                onChange={(event) =>
                  setDraft({ ...draft, value: Number(event.target.value) || 0 })
                }
              />
            )}

            <TextField
              id="d-min"
              label="Compra mínima (ARS)"
              type="number"
              min={0}
              value={draft.minSubtotal}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  minSubtotal: Number(event.target.value) || 0,
                })
              }
            />

            <TextField
              id="d-max-uses"
              label="Usos máximos (vacío = sin límite)"
              type="number"
              min={1}
              value={draft.maxUses ?? ""}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  maxUses: event.target.value
                    ? Number(event.target.value)
                    : null,
                })
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <TextField
                id="d-start"
                label="Desde"
                type="date"
                value={draft.startsAt ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, startsAt: event.target.value || null })
                }
              />
              <TextField
                id="d-end"
                label="Hasta"
                type="date"
                value={draft.endsAt ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, endsAt: event.target.value || null })
                }
              />
            </div>

            <div className="pt-2">
              <Toggle
                label="Activo"
                hint="Un cupón inactivo no se puede canjear, aunque esté en fecha."
                checked={draft.active}
                onChange={(active) => setDraft({ ...draft, active })}
              />
            </div>
          </div>
        )}
      </AdminDrawer>
    </>
  );
}
