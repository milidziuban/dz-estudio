import { installmentsTexts, type InstallmentsTexts } from "../lib/promos";
import { SETTINGS_DEFAULTS, useStoreSettings } from "./useStoreSettings";

/**
 * Textos de cuotas que anuncia la tienda, armados con los dos campos de
 * /admin/pagos (`store_settings.pagos.mercadopago`). Mientras la fila carga,
 * o si la lectura falla, valen los del código (`SETTINGS_DEFAULTS`, que copia
 * `INSTALLMENTS`): son los mismos números que hay en la base, así el texto
 * no salta al llegar la respuesta.
 *
 * La marquesina no pasa por acá: sus líneas se guardan como texto en
 * `marketing.marquee` y se editan a mano en /admin/marketing.
 */
export function useInstallments(): InstallmentsTexts {
  const { data: settings } = useStoreSettings();
  const mercadopago = (settings?.pagos ?? SETTINGS_DEFAULTS.pagos).mercadopago;
  return installmentsTexts({
    sinInteres: mercadopago.installments,
    max: mercadopago.maxInstallments,
  });
}
