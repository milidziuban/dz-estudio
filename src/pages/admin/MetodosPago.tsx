import { Link } from "react-router-dom";
import PageHeading from "../../components/admin/PageHeading";
import SaveBar from "../../components/admin/SaveBar";
import SettingsSection from "../../components/admin/SettingsSection";
import Toggle from "../../components/admin/Toggle";
import TextField from "../../components/TextField";
import { useSettingsDraft } from "../../hooks/useStoreSettings";
import { formatPrice } from "../../lib/format";
import { INSTALLMENTS, installmentsTexts } from "../../lib/promos";

export default function AdminMetodosPago() {
  const pagos = useSettingsDraft("pagos");
  const { mercadopago, transferencia } = pagos.value;
  // Con el borrador y no con lo guardado: así se ve qué va a decir la tienda
  // antes de apretar Guardar. Es la misma función que usa la tienda.
  const cuotas = installmentsTexts({
    sinInteres: mercadopago.installments,
    max: mercadopago.maxInstallments,
  });

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
                este campo dice cuántas anuncia la tienda y cuántas deja
                preseleccionadas Mercado Pago al pagar. El{" "}
                <strong>tope</strong> sí es real: viaja en la preferencia de
                pago y de ahí para arriba el cliente no ve más opciones. Entre
                una y otra quedan las Cuotas Simples, con el interés a cargo del
                cliente. Mercado Pago no las ofrece por debajo de{" "}
                <strong>{formatPrice(INSTALLMENTS.minAmount)}</strong>: ese
                piso no es un campo, está escrito en el código (
                <code className="font-mono">lib/promos.ts</code>) — si Mercado
                Pago lo cambia, se actualiza ahí.
              </p>
              <p className="mt-2">
                En <strong>0</strong> la tienda deja de anunciarlas: los textos
                pasan a hablar solo del tope y de las Cuotas Simples.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <TextField
                  id="mp-installments"
                  label="Cuotas sin interés"
                  type="number"
                  min={0}
                  max={24}
                  value={mercadopago.installments}
                  onChange={(event) =>
                    pagos.update({
                      ...pagos.value,
                      mercadopago: {
                        ...mercadopago,
                        installments: Number(event.target.value) || 0,
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
              </div>

              {/* Antes acá había un campo "Cómo se anuncia" que no leía
                  ninguna pantalla de la tienda: se escribía, se guardaba y no
                  cambiaba nada. En su lugar va lo que la tienda dice de
                  verdad, armado con los dos números de arriba tal como están
                  en el borrador. */}
              <div className="mt-4 rounded-xl bg-white p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/65">
                  {pagos.dirty
                    ? "Cómo lo va a anunciar la tienda al guardar"
                    : "Cómo se anuncia hoy en la tienda"}
                </p>
                <p className="mt-2 text-sm text-ink">{cuotas.detail}</p>
                <p className="mt-1 text-[11px] text-ink/65">
                  En la portada y en las fichas, más corto:{" "}
                  <span className="text-ink">{cuotas.label}</span>
                </p>
                <p className="mt-2 text-[11px] leading-relaxed">
                  No es un campo: la frase se arma sola con las cuotas sin
                  interés y el tope de arriba, y la tienda la lee de acá. La
                  marquesina va aparte: sus líneas se escriben a mano en{" "}
                  <Link to="/admin/marketing" className="underline">
                    Marketing
                  </Link>
                  , así que si cambiás las cuotas, cambiá también la línea de
                  ahí.
                </p>
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
