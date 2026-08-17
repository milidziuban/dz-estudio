import PageHeading from "../../components/admin/PageHeading";
import SaveBar from "../../components/admin/SaveBar";
import SettingsSection from "../../components/admin/SettingsSection";
import Toggle from "../../components/admin/Toggle";
import TextField from "../../components/TextField";
import { useSettingsDraft } from "../../hooks/useStoreSettings";
import { formatPrice } from "../../lib/format";
import type { ShippingOptionSetting } from "../../types/admin";

export default function AdminMetodosEnvio() {
  const envios = useSettingsDraft("envios");
  const { options, freeShippingFrom } = envios.value;

  const setOption = (index: number, patch: Partial<ShippingOptionSetting>) => {
    const next = [...options];
    next[index] = { ...next[index], ...patch };
    envios.update({ ...envios.value, options: next });
  };

  const saveBar = (
    <SaveBar
      dirty={envios.dirty}
      saved={envios.saved}
      saving={envios.saving}
      error={envios.error}
      onSave={() => void envios.save()}
      onReset={envios.reset}
    />
  );

  return (
    <>
      <PageHeading
        title={
          <>
            Métodos de{" "}
            <em className="font-serif font-normal italic text-celeste">envío</em>
          </>
        }
        description="Lo que el cliente elige en el paso 2 del checkout. Los costos que pongas acá son los que se cobran."
      />

      <div className="space-y-3">
        <SettingsSection
          title="Opciones de entrega"
          description="Son los tres métodos que acepta la base de datos. Podés cambiarles el nombre, la aclaración y el costo, o apagar los que no quieras ofrecer — pero no se pueden agregar métodos nuevos sin tocar el código y la migración."
          footer={saveBar}
        >
          <ul className="space-y-4">
            {options.map((option, index) => (
              <li key={option.id} className="rounded-xl bg-cream p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">
                    {option.id}
                  </p>
                  <Toggle
                    label="Ofrecer"
                    checked={option.enabled}
                    onChange={(enabled) => setOption(index, { enabled })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    id={`e-label-${option.id}`}
                    label="Nombre"
                    value={option.label}
                    onChange={(event) =>
                      setOption(index, { label: event.target.value })
                    }
                  />
                  <TextField
                    id={`e-cost-${option.id}`}
                    label="Costo (ARS)"
                    type="number"
                    min={0}
                    step={100}
                    value={option.cost}
                    onChange={(event) =>
                      setOption(index, {
                        cost: Number(event.target.value) || 0,
                      })
                    }
                  />
                  <TextField
                    id={`e-detail-${option.id}`}
                    label="Aclaración"
                    className="sm:col-span-2"
                    placeholder="3 a 6 días hábiles"
                    value={option.detail}
                    onChange={(event) =>
                      setOption(index, { detail: event.target.value })
                    }
                  />
                </div>

                <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink/45">
                  En el checkout:{" "}
                  {option.cost === 0 ? "Gratis" : formatPrice(option.cost)}
                </p>
              </li>
            ))}
          </ul>

          <p className="mt-5 text-[11px] leading-relaxed text-ink/50">
            ⚠️ Andreani cotiza por código postal: estos son montos fijos que vos
            definís, no la tarifa real de la transportista. Conviene dejarlos un
            poco por encima del promedio de lo que pagás.
          </p>
        </SettingsSection>

        <SettingsSection
          title="Envío gratis"
          description="Desde este monto de subtotal, cualquier opción de envío pasa a costar cero. Vacío = sin envío gratis."
          footer={saveBar}
        >
          <div className="max-w-xs space-y-4">
            <Toggle
              label="Activar envío gratis"
              checked={freeShippingFrom !== null}
              onChange={(checked) =>
                envios.update({
                  ...envios.value,
                  freeShippingFrom: checked ? 60000 : null,
                })
              }
            />

            {freeShippingFrom !== null && (
              <TextField
                id="e-free-from"
                label="Desde (ARS)"
                type="number"
                min={0}
                step={1000}
                value={freeShippingFrom}
                onChange={(event) =>
                  envios.update({
                    ...envios.value,
                    freeShippingFrom: Number(event.target.value) || 0,
                  })
                }
              />
            )}
          </div>

          {freeShippingFrom !== null && (
            <p className="mt-4 text-[11px] leading-relaxed text-ink/50">
              Queda: envío sin cargo comprando {formatPrice(freeShippingFrom)} o
              más. Acordate de contarlo en la marquesina.
            </p>
          )}
        </SettingsSection>
      </div>
    </>
  );
}
