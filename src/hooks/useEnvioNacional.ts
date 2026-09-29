import type { EnvioNacional } from "../lib/envio-texto";
import { useStoreSettings } from "./useStoreSettings";

/**
 * El envío a todo el país como lo tiene cargado el panel. `activo` recién es
 * true cuando la configuración ya llegó de la base y la opción
 * "envio-nacional" está prendida: mientras carga, o si falla la lectura, los
 * textos no prometen un precio que quizás no sea el que se cobra.
 */
export function useEnvioNacional(): EnvioNacional {
  const { data } = useStoreSettings();
  const option = data?.envios.options.find((o) => o.id === "envio-nacional");

  return {
    activo: Boolean(option?.enabled),
    costo: option?.cost ?? 0,
    gratisDesde: data?.envios.freeShippingFrom ?? null,
  };
}
