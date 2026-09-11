import type { ResolvedCartItem } from "./cart";
import type { CheckoutData } from "./checkout";
import { SHIPPING_OPTIONS } from "./checkout";
import { formatPrice } from "./format";
import type { AppliedDiscount } from "./promos";
import { SITE } from "./site";

function itemLines(items: ResolvedCartItem[]): string[] {
  return items.map(({ product, variant, qty }) => {
    const name = variant ? `${product.name} (${variant.label})` : product.name;
    return `• ${qty}x ${name} — ${formatPrice(product.price * qty)}`;
  });
}

function build(lines: string[]): string {
  const text = lines.filter((line) => line !== null).join("\n");
  return `${SITE.whatsappUrl}?text=${encodeURIComponent(text)}`;
}

/**
 * Después de confirmar por transferencia: el mensaje con el que la clienta
 * manda el comprobante. Lleva el número de pedido para que del otro lado se
 * sepa a qué orden corresponde sin preguntar.
 */
export function comprobanteWhatsappUrl(
  orderNumber?: string,
  nombre?: string,
): string {
  return build([
    `¡Hola DZ Estudio!${nombre ? ` Soy ${nombre}.` : ""}`,
    `Te mando el comprobante de la transferencia del pedido${
      orderNumber ? ` #${orderNumber}` : " que acabo de hacer"
    }.`,
  ]);
}

/**
 * La lectura de los datos bancarios falló y la pantalla de gracias los pide
 * por WhatsApp en vez de inventarlos (ver `faltanDatosBancarios`).
 */
export function pedirDatosWhatsappUrl(
  orderNumber?: string,
  nombre?: string,
): string {
  return build([
    `¡Hola DZ Estudio!${nombre ? ` Soy ${nombre}.` : ""}`,
    `Hice el pedido${
      orderNumber ? ` #${orderNumber}` : ""
    } para pagar por transferencia y no me cargaron los datos de la cuenta. ¿Me los pasás?`,
  ]);
}

/** Pedido armado desde el carrito, sin pasar por el checkout. */
export function cartWhatsappUrl(
  items: ResolvedCartItem[],
  subtotal: number,
  discount: AppliedDiscount | null,
): string {
  return build([
    "¡Hola DZ Estudio! Quiero hacer este pedido:",
    "",
    ...itemLines(items),
    "",
    `Subtotal: ${formatPrice(subtotal)}`,
    ...(discount
      ? [`Descuento (${discount.label}): -${formatPrice(discount.amount)}`]
      : []),
    `Total sin envío: ${formatPrice(subtotal - (discount?.amount ?? 0))}`,
    "",
    "¿Me pasás el costo de envío y cómo sigo con el pago?",
  ]);
}

/** Pedido completo, con los datos que ya cargó en el checkout. */
export function checkoutWhatsappUrl(
  data: Partial<CheckoutData>,
  items: ResolvedCartItem[],
  subtotal: number,
  discount: AppliedDiscount | null,
  /** undefined = todavía no eligió envío · null = a coordinar */
  shippingCost: number | null | undefined,
  total: number,
): string {
  const envio = SHIPPING_OPTIONS.find((o) => o.id === data.envio);
  const nombre = [data.nombre, data.apellido].filter(Boolean).join(" ");

  return build([
    "¡Hola DZ Estudio! Quiero cerrar este pedido:",
    "",
    ...itemLines(items),
    "",
    `Subtotal: ${formatPrice(subtotal)}`,
    ...(discount
      ? [`Descuento (${discount.label}): -${formatPrice(discount.amount)}`]
      : []),
    // Con el envío a coordinar la etiqueta ya es el dato: "Envío (Envío a
    // coordinar): a coordinar" lo decía tres veces.
    ...(envio && shippingCost !== undefined
      ? [
          shippingCost === null
            ? "Envío: a coordinar"
            : `Envío (${envio.label}): ${
                shippingCost === 0 ? "gratis" : formatPrice(shippingCost)
              }`,
        ]
      : []),
    shippingCost === null
      ? `Total de los productos: ${formatPrice(total)}`
      : `Total: ${formatPrice(total)}`,
    "",
    ...(nombre ? [`Nombre: ${nombre}`] : []),
    ...(data.email ? [`Email: ${data.email}`] : []),
    ...(data.telefono ? [`Teléfono: ${data.telefono}`] : []),
    ...(data.direccion
      ? [
          `Dirección: ${data.direccion}, ${data.ciudad ?? ""} (${
            data.cp ?? ""
          }), ${data.provincia ?? ""}`,
        ]
      : []),
    ...(shippingCost === undefined
      ? ["", "Todavía no elegí el envío, ¿me ayudás?"]
      : []),
    ...(data.notas ? ["", `Nota: ${data.notas}`] : []),
  ]);
}
