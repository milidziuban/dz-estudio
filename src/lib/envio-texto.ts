import { formatPrice } from "./format";

/** Lo que la tienda sabe del envío a todo el país, tal como lo arma
 *  `useEnvioNacional`. Con `activo` en false —la opción está apagada o
 *  todavía no cargó la configuración— los textos vuelven a decir que el
 *  costo se coordina por WhatsApp, que es lo único seguro de prometer. */
export type EnvioNacional = {
  activo: boolean;
  costo: number;
  gratisDesde: number | null;
};

const COORDINAR = "el costo se coordina por WhatsApp";

/** "gratis desde $50.000", o null si no hay envío gratis. */
const gratis = ({ gratisDesde }: EnvioNacional): string | null =>
  gratisDesde === null ? null : `gratis desde ${formatPrice(gratisDesde)}`;

/** "$15.000", o "sin cargo" si el panel lo dejó en cero. */
const costo = ({ costo }: EnvioNacional): string =>
  costo > 0 ? formatPrice(costo) : "sin cargo";

const mayuscula = (texto: string): string =>
  texto.charAt(0).toUpperCase() + texto.slice(1);

/** Oración completa, para la ficha de producto. */
export function envioFrase(envio: EnvioNacional): string {
  if (!envio.activo) {
    return "Envíos a todo el país. El costo del envío lo coordinamos por WhatsApp antes de despachar.";
  }
  if (envio.costo <= 0) return "Envío sin cargo a todo el país.";
  const desde = gratis(envio);
  return `Envío a todo el país a ${costo(envio)}, vaya a donde vaya.${
    desde ? ` ${mayuscula(desde)}.` : ""
  }`;
}

/** Una línea corta, para el footer. */
export function envioFraseCorta(envio: EnvioNacional): string {
  if (!envio.activo) return `Envíos a todo el país, ${COORDINAR}`;
  if (envio.costo <= 0) return "Envío sin cargo a todo el país";
  const desde = gratis(envio);
  return `Envío a todo el país a ${costo(envio)}${desde ? `, ${desde}` : ""}`;
}

/** Etiqueta mono del hero: lo más fuerte que haya para decir. */
export function envioTitular(envio: EnvioNacional): string {
  if (!envio.activo) return "Envíos a todo el país";
  if (envio.costo <= 0) return "Envío sin cargo a todo el país";
  const desde = gratis(envio);
  return desde ? `Envío ${desde}` : `Envío a todo el país a ${costo(envio)}`;
}

/** Bajada del bloque de valores de la home, debajo de "Envíos a todo el país". */
export function envioDetalle(envio: EnvioNacional): string {
  if (!envio.activo) {
    return "El costo lo coordinamos por WhatsApp antes de despachar.";
  }
  if (envio.costo <= 0) return "Sin cargo, vaya a donde vaya.";
  const desde = gratis(envio);
  return `${formatPrice(envio.costo)} fijos, vaya a donde vaya.${
    desde ? ` ${mayuscula(desde)}.` : ""
  }`;
}
