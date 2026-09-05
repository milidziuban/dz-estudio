import PageHeading from "../../components/admin/PageHeading";
import SaveBar from "../../components/admin/SaveBar";
import SettingsSection from "../../components/admin/SettingsSection";
import Toggle from "../../components/admin/Toggle";
import TextField from "../../components/TextField";
import { useSettingsDraft } from "../../hooks/useStoreSettings";

export default function AdminMetodosPago() {
  const pagos = useSettingsDraft("pagos");
  const { mercadopago, transferencia } = pagos.value;

  const saveBar = (
    <SaveBar
      dirty={pagos.dirty}
      saved={pagos.saved}
      saving={pagos.saving}
      error={pagos.error}
      onSave={() => void pagos.save()}
      onReset={pagos.reset}
    />
  );

  return (
    <>
      <PageHeading
        title={
          <>
            Métodos de{" "}
            <em className="font-serif font-normal italic text-verde">pago</em>
          </>
        }
        description="Qué puede elegir el cliente en el último paso del checkout, y con qué datos transfiere."
      />

      <div className="space-y-3">
        <SettingsSection
          title="Mercado Pago"
          description="Tarjetas de crédito, débito y efectivo. El cliente sale del sitio, paga en Mercado Pago y vuelve; el webhook marca la orden como pagada. Cuotas sin tarjeta (Mercado Crédito) queda excluido a propósito."
          footer={saveBar}
        >
          <div className="space-y-5">
            <Toggle
              label="Aceptar Mercado Pago"
              hint="Si lo apagás, el checkout solo ofrece transferencia."
              checked={mercadopago.enabled}
              onChange={(enabled) =>
                pagos.update({
                  ...pagos.value,
                  mercadopago: { ...mercadopago, enabled },
                })
              }
            />

            <div className="rounded-xl bg-cream p-4 text-xs leading-relaxed text-ink/65">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink/65">
                Cuotas
              </p>
              <p className="mt-2">
                Las <strong>sin interés</strong> las absorbés vos y se activan
                en tu cuenta de Mercado Pago (Tu negocio → Costos y cuotas);
                este campo solo dice cuántas anuncia la tienda. El{" "}
                <strong>tope</strong> sí es real: viaja en la preferencia de
                pago y de ahí para arriba el cliente no ve más opciones. Entre
                una y otra quedan las Cuotas Simples, con el interés a cargo del
                cliente. Mercado Pago no las ofrece por debajo de{" "}
                <strong>$45.000</strong>: ese piso está escrito en el texto que
                anuncia la tienda (
                <code className="font-mono">lib/promos.ts</code>), no en un
                campo de acá — si Mercado Pago lo cambia, se actualiza ahí.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <TextField
                  id="mp-installments"
                  label="Cuotas sin interés"
                  type="number"
                  min={1}
                  max={24}
                  value={mercadopago.installments}
                  onChange={(event) =>
                    pagos.update({
                      ...pagos.value,
                      mercadopago: {
                        ...mercadopago,
                        installments: Number(event.target.value) || 1,
                      },
                    })
                  }
                />
                <TextField
                  id="mp-max-installments"
                  label="Tope de cuotas en el checkout"
                  type="number"
                  min={1}
                  max={24}
                  value={mercadopago.maxInstallments}
                  onChange={(event) =>
                    pagos.update({
                      ...pagos.value,
                      mercadopago: {
                        ...mercadopago,
                        maxInstallments: Number(event.target.value) || 1,
                      },
                    })
                  }
                />
                <TextField
                  id="mp-installments-label"
                  label="Cómo se anuncia"
                  value={mercadopago.installmentsLabel}
                  onChange={(event) =>
                    pagos.update({
                      ...pagos.value,
                      mercadopago: {
                        ...mercadopago,
                        installmentsLabel: event.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="rounded-xl bg-cream p-4 text-xs leading-relaxed text-ink/65">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink/65">
                Credenciales
              </p>
              <p className="mt-2">
                El access token de Mercado Pago no se guarda acá: vive como
                secreto de las Edge Functions{" "}
                <code className="font-mono">create-preference</code> y{" "}
                <code className="font-mono">mp-webhook</code>. Se cambia desde
                Supabase → Edge Functions → Secrets, nunca desde el navegador.
              </p>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Transferencia bancaria"
          description="Estos datos son los que ve el cliente cuando elige transferir, y los que le repetimos en la pantalla de gracias."
          footer={saveBar}
        >
          <div className="space-y-5">
            <Toggle
              label="Aceptar transferencia"
              checked={transferencia.enabled}
              onChange={(enabled) =>
                pagos.update({
                  ...pagos.value,
                  transferencia: { ...transferencia, enabled },
                })
              }
            />

            <TextField
              id="tr-percent"
              label="Descuento por transferencia %"
              type="number"
              min={0}
              max={100}
              value={transferencia.discountPercent}
              onChange={(event) =>
                pagos.update({
                  ...pagos.value,
                  transferencia: {
                    ...transferencia,
                    discountPercent: Number(event.target.value) || 0,
                  },
                })
              }
            />
            <p className="-mt-3 text-[11px] leading-relaxed text-ink/65">
              El descuento que se aplica de verdad en el carrito se edita en{" "}
              <strong>Precios</strong>. Este campo es el que queda guardado
              como referencia del método de pago.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="tr-banco"
                label="Banco"
                value={transferencia.banco}
                onChange={(event) =>
                  pagos.update({
                    ...pagos.value,
                    transferencia: {
                      ...transferencia,
                      banco: event.target.value,
                    },
                  })
                }
              />
              <TextField
                id="tr-titular"
                label="Titular"
                value={transferencia.titular}
                onChange={(event) =>
                  pagos.update({
                    ...pagos.value,
                    transferencia: {
                      ...transferencia,
                      titular: event.target.value,
                    },
                  })
                }
              />
              <TextField
                id="tr-cuit"
                label="CUIT"
                value={transferencia.cuit}
                onChange={(event) =>
                  pagos.update({
                    ...pagos.value,
                    transferencia: {
                      ...transferencia,
                      cuit: event.target.value,
                    },
                  })
                }
              />
              <TextField
                id="tr-alias"
                label="Alias"
                value={transferencia.alias}
                onChange={(event) =>
                  pagos.update({
                    ...pagos.value,
                    transferencia: {
                      ...transferencia,
                      alias: event.target.value,
                    },
                  })
                }
              />
              <TextField
                id="tr-cbu"
                label="CBU"
                className="sm:col-span-2"
                value={transferencia.cbu}
                onChange={(event) =>
                  pagos.update({
                    ...pagos.value,
                    transferencia: {
                      ...transferencia,
                      cbu: event.target.value.replace(/\s/g, ""),
                    },
                  })
                }
              />
            </div>

            {[transferencia.banco, transferencia.cbu, transferencia.alias].some(
              (value) => value.startsWith("["),
            ) && (
              <p className="rounded-xl bg-amarillo px-4 py-3 text-xs leading-relaxed">
                ✦ Todavía hay datos de ejemplo entre corchetes. Completalos
                antes de aceptar transferencias: es lo que el cliente copia para
                pagarte.
              </p>
            )}
          </div>
        </SettingsSection>
      </div>
    </>
  );
}
