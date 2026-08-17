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
  shippingCost: number | undefined,
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
    ...(envio
      ? [
          `Envío (${envio.label}): ${
            envio.cost === 0 ? "gratis" : formatPrice(envio.cost)
          }`,
        ]
      : []),
    `Total: ${formatPrice(total)}`,
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
  ]);
}
