// ============================================================
// Los tres mails del pedido, en HTML de email.
//
// Nada de Tailwind ni de variables CSS: los clientes de mail (Gmail,
// Outlook, Mail de iPhone) no leen <style> confiablemente, así que va
// todo en tablas y estilos inline. Las fuentes de la marca tampoco
// cargan por mail: Instrument Serif cae a Georgia y DM Mono a Courier,
// que son las dos que sí están en todos lados y mantienen el contraste
// entre serif italic y mono.
// ============================================================

export const COLORS = {
  ink: "#1A1A1A",
  cream: "#F3EFE4",
  white: "#FFFFFF",
  pink: "#F26D9E",
  lila: "#B8A4E3",
  verde: "#7CB562",
  amarillo: "#F4C542",
} as const;

const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
const SERIF = "Georgia, Times New Roman, serif";
const MONO = "Courier New, Courier, monospace";

export type OrderItemRow = {
  name: string;
  variant: string | null;
  qty: number;
  price: number;
};

export type MailOrder = {
  numero: string;
  nombre: string;
  items: OrderItemRow[];
  subtotal: number;
  discount: number;
  discountLabel: string | null;
  shippingCost: number;
  total: number;
  envioLabel: string;
  envioDetalle: string | null;
  esRetiro: boolean;
  direccion: string | null;
  trackingCode: string | null;
  notas: string | null;
};

export type SiteInfo = {
  url: string;
  instagram: string;
  instagramUrl: string;
  whatsapp: string;
  whatsappUrl: string;
  retiro: { nombre: string; direccion: string; horario: string };
};

export type BankInfo = {
  banco: string;
  titular: string;
  cuit: string;
  cbu: string;
  alias: string;
};

export function formatPrice(value: number): string {
  return `$${Math.round(value).toLocaleString("es-AR")}`;
}

function escape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Titular de la marca: sans bold + una palabra en serif italic rosa. */
function heading(plain: string, accent: string): string {
  return `<h1 style="margin:0;font-family:${SANS};font-size:30px;line-height:1.15;font-weight:700;letter-spacing:-0.5px;color:${COLORS.ink};">
    ${escape(plain)} <em style="font-family:${SERIF};font-style:italic;font-weight:400;color:${COLORS.pink};">${escape(accent)}</em>
  </h1>`;
}

function label(text: string): string {
  return `<p style="margin:0 0 10px;font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.ink};opacity:0.6;">${escape(text)}</p>`;
}

function paragraph(html: string): string {
  return `<p style="margin:0 0 16px;font-family:${SANS};font-size:15px;line-height:1.6;color:${COLORS.ink};">${html}</p>`;
}

/** Bloque de color plano, sin borde ni sombra — como las cards del sitio. */
function block(bg: string, inner: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-radius:16px;background:${bg};margin:0 0 24px;">
    <tr><td style="padding:22px 24px;">${inner}</td></tr>
  </table>`;
}

function money(text: string, value: string, bold = false): string {
  const weight = bold ? "700" : "400";
  return `<tr>
    <td style="padding:5px 0;font-family:${SANS};font-size:14px;color:${COLORS.ink};font-weight:${weight};">${escape(text)}</td>
    <td align="right" style="padding:5px 0;font-family:${MONO};font-size:14px;color:${COLORS.ink};font-weight:${weight};white-space:nowrap;">${escape(value)}</td>
  </tr>`;
}

/** Detalle del pedido: los ítems, los descuentos y a dónde va. */
function orderDetail(order: MailOrder): string {
  const items = order.items
    .map((item) => {
      const variant = item.variant
        ? `<span style="opacity:0.6;"> · ${escape(item.variant)}</span>`
        : "";
      return `<tr>
        <td style="padding:8px 0;font-family:${SANS};font-size:14px;line-height:1.4;color:${COLORS.ink};">
          ${escape(item.name)}${variant}<br>
          <span style="font-family:${MONO};font-size:12px;opacity:0.6;">x${item.qty}</span>
        </td>
        <td align="right" style="padding:8px 0;font-family:${MONO};font-size:14px;color:${COLORS.ink};white-space:nowrap;">${escape(formatPrice(item.price * item.qty))}</td>
      </tr>`;
    })
    .join("");

  const divider = `<tr><td colspan="2" style="padding:0;"><div style="height:1px;background:${COLORS.ink};opacity:0.12;margin:10px 0;"></div></td></tr>`;

  const descuento =
    order.discount > 0
      ? money(
          order.discountLabel ?? "Descuento",
          `- ${formatPrice(order.discount)}`,
        )
      : "";

  const envio = money(
    order.envioLabel,
    order.shippingCost > 0 ? formatPrice(order.shippingCost) : "Gratis",
  );

  const destino = order.esRetiro
    ? `${label("Retirás en")}
       <p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.6;color:${COLORS.ink};">
         ${escape(order.envioDetalle ?? "")}
       </p>`
    : `${label("Enviamos a")}
       <p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.6;color:${COLORS.ink};">
         ${escape(order.direccion ?? "")}
       </p>`;

  const notas = order.notas
    ? `<div style="margin-top:18px;">${label("Tu nota")}<p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.6;color:${COLORS.ink};">${escape(order.notas)}</p></div>`
    : "";

  return block(
    COLORS.white,
    `${label(`Pedido #${order.numero}`)}
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
       ${items}
       ${divider}
       ${money("Subtotal", formatPrice(order.subtotal))}
       ${descuento}
       ${envio}
       ${divider}
       ${money("Total", formatPrice(order.total), true)}
     </table>
     <div style="height:1px;background:${COLORS.ink};opacity:0.12;margin:20px 0;"></div>
     ${destino}
     ${notas}`,
  );
}

function shell(site: SiteInfo, preheader: string, inner: string): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${COLORS.cream};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escape(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.cream};">
    <tr><td align="center" style="padding:32px 16px 48px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <tr><td style="padding:0 0 28px;">
          <span style="font-family:${SANS};font-size:15px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${COLORS.ink};">DZ Estudio</span>
          <span style="font-family:${MONO};font-size:11px;letter-spacing:2px;color:${COLORS.pink};"> &#10022;</span>
        </td></tr>

        <tr><td>${inner}</td></tr>

        <tr><td style="padding:12px 4px 0;">
          <div style="height:1px;background:${COLORS.ink};opacity:0.12;margin:0 0 18px;"></div>
          <p style="margin:0 0 8px;font-family:${SANS};font-size:13px;line-height:1.6;color:${COLORS.ink};opacity:0.7;">
            Si algo no cierra, respondé este mail o escribinos por
            <a href="${site.whatsappUrl}" style="color:${COLORS.ink};">WhatsApp al ${escape(site.whatsapp)}</a>.
          </p>
          <p style="margin:0;font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.ink};opacity:0.5;">
            <a href="${site.url}" style="color:${COLORS.ink};text-decoration:none;">dz-estudio.com</a>
            &nbsp;&#10022;&nbsp;
            <a href="${site.instagramUrl}" style="color:${COLORS.ink};text-decoration:none;">@${escape(site.instagram)}</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ------------------------------------------------------------
// 1 · Transferencia pendiente
// ------------------------------------------------------------
export function transferenciaEmail(
  order: MailOrder,
  site: SiteInfo,
  bank: BankInfo,
): { subject: string; html: string } {
  const dato = (k: string, v: string) =>
    `<tr>
      <td style="padding:4px 0;font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.ink};opacity:0.6;white-space:nowrap;">${escape(k)}</td>
      <td align="right" style="padding:4px 0 4px 16px;font-family:${MONO};font-size:13px;color:${COLORS.ink};word-break:break-all;">${escape(v)}</td>
    </tr>`;

  const inner = `
    ${heading(`Anotado, ${order.nombre}.`, "Falta un paso.")}
    <div style="height:20px;"></div>
    ${paragraph("Tu pedido quedó reservado. Para cerrarlo, transferí el total a esta cuenta:")}
    ${block(
      COLORS.lila,
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${dato("Alias", bank.alias)}
        ${dato("CBU", bank.cbu)}
        ${dato("Titular", bank.titular)}
        ${dato("CUIT", bank.cuit)}
        ${dato("Banco", bank.banco)}
      </table>
      <div style="height:1px;background:${COLORS.ink};opacity:0.15;margin:16px 0;"></div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${money("Monto exacto", formatPrice(order.total), true)}
      </table>`,
    )}
    ${paragraph(`Cuando la hagas, mandanos el comprobante por <a href="${site.whatsappUrl}" style="color:${COLORS.ink};font-weight:700;">WhatsApp</a> y lo damos por cerrado.`)}
    ${paragraph(`<strong>Te lo reservamos 48 horas.</strong> Después vuelve a la tienda: las ediciones son cortas y hay gente esperando.`)}
    <div style="height:12px;"></div>
    ${orderDetail(order)}
  `;

  return {
    subject: `Falta la transferencia — pedido #${order.numero}`,
    html: shell(site, "Te lo reservamos 48 horas.", inner),
  };
}

// ------------------------------------------------------------
// 2 · Pago confirmado
// ------------------------------------------------------------
export function pagoConfirmadoEmail(
  order: MailOrder,
  site: SiteInfo,
): { subject: string; html: string } {
  const queSigue = order.esRetiro
    ? `Te avisamos por acá cuando esté listo para que lo pases a buscar por ${escape(site.retiro.direccion)}.`
    : "Lo preparamos en el depósito y te escribimos de nuevo cuando salga, con el código de seguimiento.";

  const inner = `
    ${heading(`¡Listo, ${order.nombre}!`, "Ya es tuyo.")}
    <div style="height:20px;"></div>
    ${paragraph("El pago entró. Empezamos a preparar tu pedido.")}
    ${paragraph(queSigue)}
    <div style="height:12px;"></div>
    ${orderDetail(order)}
    ${paragraph("Guardá este mail: acá está todo lo que pediste y cuánto pagaste.")}
  `;

  return {
    subject: `Pago confirmado — pedido #${order.numero}`,
    html: shell(site, "El pago entró. Ya lo estamos preparando.", inner),
  };
}

// ------------------------------------------------------------
// 3 · Despachado (o listo para retirar)
// ------------------------------------------------------------
export function despachadoEmail(
  order: MailOrder,
  site: SiteInfo,
): { subject: string; html: string } {
  const seguimiento = order.trackingCode
    ? block(
        COLORS.amarillo,
        `${label("Código de seguimiento")}
         <p style="margin:0;font-family:${MONO};font-size:20px;letter-spacing:2px;font-weight:700;color:${COLORS.ink};word-break:break-all;">${escape(order.trackingCode)}</p>
         <p style="margin:10px 0 0;font-family:${SANS};font-size:13px;line-height:1.5;color:${COLORS.ink};opacity:0.75;">Cargalo en la web del correo. Puede tardar unas horas en aparecer.</p>`,
      )
    : "";

  const inner = order.esRetiro
    ? `
      ${heading(`${order.nombre},`, "te espera.")}
      <div style="height:20px;"></div>
      ${paragraph("Tu pedido está armado y listo para retirar.")}
      ${block(
        COLORS.verde,
        `${label("Dónde")}
         <p style="margin:0 0 14px;font-family:${SANS};font-size:15px;line-height:1.5;color:${COLORS.ink};font-weight:700;">${escape(site.retiro.direccion)}</p>
         ${label("Cuándo")}
         <p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.5;color:${COLORS.ink};">${escape(site.retiro.horario)}</p>`,
      )}
      ${paragraph("Antes de salir, escribinos por WhatsApp así te esperamos con todo listo.")}
    `
    : `
      ${heading(`${order.nombre},`, "va en camino.")}
      <div style="height:20px;"></div>
      ${paragraph(`Tu pedido salió del depósito por ${escape(order.envioLabel)}.`)}
      ${seguimiento}
      ${order.direccion ? paragraph(`Va a <strong>${escape(order.direccion)}</strong>.`) : ""}
    `;

  const cierre = `${paragraph("Cuando llegue, si te sale una foto linda, mandala. Nos gusta ver dónde terminan.")}
    <div style="height:12px;"></div>
    ${orderDetail(order)}`;

  return {
    subject: order.esRetiro
      ? `Listo para retirar — pedido #${order.numero}`
      : `Tu pedido salió — #${order.numero}`,
    html: shell(
      site,
      order.esRetiro
        ? "Está armado y te espera en Santa Fe."
        : "Salió del depósito.",
      inner + cierre,
    ),
  };
}
