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
  const { options, freeShippingFrom, origenCp, paquete } = envios.value;

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
          description="Son los métodos que acepta la base de datos. Podés cambiarles el nombre, la aclaración y el costo, o apagar los que no quieras ofrecer — pero no se pueden agregar métodos nuevos sin tocar el código y la migración."
          footer={saveBar}
        >
          <ul className="space-y-4">
            {options.map((option, index) => (
              <li key={option.id} className="rounded-xl bg-cream p-5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/65">
                      {option.id}
                    </p>
                    {option.mode === "vivo" && (
                      <span className="rounded-full bg-verde/25 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-petroleo">
                        Cotiza en vivo
                      </span>
                    )}
                  </div>
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
                    label={
                      option.mode === "vivo"
                        ? "Costo de respaldo (ARS)"
                        : "Costo (ARS)"
                    }
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

                <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink/65">
                  {option.mode === "vivo"
                    ? "Mientras la cotización en vivo esté configurada, este costo no se usa — solo entra si la transportista no responde."
                    : `En el checkout: ${option.cost === 0 ? "Gratis" : formatPrice(option.cost)}`}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-5 space-y-2 text-[11px] leading-relaxed text-ink/65">
            <p>
              ✧ <strong>Correo Argentino</strong> cotiza en vivo por código
              postal apenas cargues las credenciales de MiCorreo como
              secretos de la función <code>shipping-quote</code> — el paso a
              paso está en <code>PANEL-ADMIN.md</code>.
            </p>
            <p>
              ✧ <strong>Andreani</strong> todavía cotiza con costo fijo: su
              API no se autogestiona, las credenciales las da tu comercial de
              cuenta. Cuando las tengas, avisá para conectar la cotización
              real igual que con Correo Argentino.
            </p>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Datos para cotizar"
          description="Lo que usan Andreani y Correo Argentino para calcular el envío: desde dónde sale el paquete y en qué medidas."
          footer={saveBar}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="e-origen-cp"
              label="Código postal de origen"
              value={origenCp}
              onChange={(event) =>
                envios.update({ ...envios.value, origenCp: event.target.value })
              }
            />
          </div>

          <p className="mb-3 mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/65">
            Paquete estándar
          </p>
          <p className="mb-4 text-[11px] leading-relaxed text-ink/65">
            Son objetos textiles blandos: en vez de pedir medidas por
            producto, todos los pedidos cotizan con este mismo paquete tipo.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              id="e-paquete-largo"
              label="Largo (cm)"
              type="number"
              min={1}
              value={paquete.largoCm}
              onChange={(event) =>
                envios.update({
                  ...envios.value,
                  paquete: {
                    ...paquete,
                    largoCm: Number(event.target.value) || 1,
                  },
                })
              }
            />
            <TextField
              id="e-paquete-ancho"
              label="Ancho (cm)"
              type="number"
              min={1}
              value={paquete.anchoCm}
              onChange={(event) =>
                envios.update({
                  ...envios.value,
                  paquete: {
                    ...paquete,
                    anchoCm: Number(event.target.value) || 1,
                  },
                })
              }
            />
            <TextField
              id="e-paquete-alto"
              label="Alto (cm)"
              type="number"
              min={1}
              value={paquete.altoCm}
              onChange={(event) =>
                envios.update({
                  ...envios.value,
                  paquete: {
                    ...paquete,
                    altoCm: Number(event.target.value) || 1,
                  },
                })
              }
            />
          </div>
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
            <p className="mt-4 text-[11px] leading-relaxed text-ink/65">
              Queda: envío sin cargo comprando {formatPrice(freeShippingFrom)} o
              más. Acordate de contarlo en la marquesina.
            </p>
          )}
        </SettingsSection>
      </div>
    </>
  );
}
