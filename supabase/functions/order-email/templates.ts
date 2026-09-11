// ============================================================
// Los mails del pedido, en HTML de email: tres para la clienta y uno
// interno, el aviso de pedido nuevo para quien administra la tienda.
//
// Nada de Tailwind ni de variables CSS: los clientes de mail (Gmail,
// Outlook, Mail de iPhone) no leen <style> confiablemente, así que va
// todo en tablas y estilos inline. Las fuentes de la marca tampoco
// cargan por mail: Instrument Serif cae a Georgia y DM Mono a Courier,
// que son las dos que sí están en todos lados y mantienen el contraste
// entre serif italic y mono.
//
// Gmail archiva en "Promociones" lo que le parece publicidad, y el 10/09
// lo hizo con el mail de la transferencia: la clienta no lo vio. Lo que
// sí pesa para ese filtro y acá se cuida: pocos links (no va el de
// Instagram), nada de texto oculto tipo "preheader" de newsletter, la
// versión en texto plano y ningún rastreo de aperturas ni de clics.
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
  /** El uuid entero: el aviso interno linkea a la orden en el panel. */
  id: string;
  numero: string;
  /** Solo el primer nombre: es como le hablan los mails a la clienta. */
  nombre: string;
  // Lo que sigue lo usa solo el aviso interno: a quién escribirle y por dónde.
  nombreCompleto: string;
  email: string;
  telefono: string | null;
  pago: "mp" | "transferencia";
  pagado: boolean;
  items: OrderItemRow[];
  subtotal: number;
  discount: number;
  discountLabel: string | null;
  shippingCost: number;
  total: number;
  envioLabel: string;
  envioDetalle: string | null;
  esRetiro: boolean;
  /** El envío no se cobró en la tienda: se cobra aparte. */
  envioACoordinar: boolean;
  direccion: string | null;
  trackingCode: string | null;
  notas: string | null;
};

export type SiteInfo = {
  url: string;
  /** Solo se nombra: el link a Instagram salió del pie por lo de Promociones. */
  instagram: string;
  whatsapp: string;
  whatsappUrl: string;
  /** `horario` es opcional a propósito: si el panel no lo tiene cargado, el
   *  mail no inventa uno. Ver la nota en index.ts. */
  retiro: { nombre: string; direccion: string; horario?: string };
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
    order.envioACoordinar
      ? "A coordinar"
      : order.shippingCost > 0
        ? formatPrice(order.shippingCost)
        : "Gratis",
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

/** Link a WhatsApp con el mensaje ya escrito, como los botones de la tienda. */
function whatsappLink(site: SiteInfo, text: string): string {
  return `${site.whatsappUrl}?text=${encodeURIComponent(text)}`;
}

/**
 * El marco común. Sin "preheader" oculto: ese div invisible con el resumen
 * es un truco de newsletter, y Gmail lo lee como tal. La vista previa del
 * inbox sale de la primera línea del mail, que ya dice lo que importa.
 *
 * `footer` es el pie para la clienta; el aviso interno pasa el suyo.
 */
function shell(inner: string, footer: string): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${COLORS.cream};">
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
          ${footer}
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Pie de los mails a la clienta: cómo responder, y nada más. Un solo link
 *  (WhatsApp); el sitio y el Instagram van como texto. */
function clientFooter(site: SiteInfo): string {
  return `<p style="margin:0 0 8px;font-family:${SANS};font-size:13px;line-height:1.6;color:${COLORS.ink};opacity:0.7;">
            Si algo no cierra, respondé este mail o escribinos por
            <a href="${site.whatsappUrl}" style="color:${COLORS.ink};">WhatsApp al ${escape(site.whatsapp)}</a>.
          </p>
          <p style="margin:0;font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.ink};opacity:0.5;">
            dz-estudio.com &nbsp;&#10022;&nbsp; @${escape(site.instagram)}
          </p>`;
}

// ------------------------------------------------------------
// Versión en texto plano
//
// Va en el mismo envío que el HTML, como alternativa. No es un lujo de
// accesibilidad: un mail que viaja SOLO en HTML es una de las señales que
// más pesa para que Gmail lo mande a spam, porque casi todo el correo
// legítimo lleva las dos partes. Cuando se toca un texto de arriba, hay
// que tocarlo también acá.
// ------------------------------------------------------------

function detalleTexto(order: MailOrder): string {
  const lineas = order.items.map(
    (item) =>
      `  ${item.qty} x ${item.name}${item.variant ? ` (${item.variant})` : ""}` +
      ` — ${formatPrice(item.price * item.qty)}`,
  );

  const montos = [
    `  Subtotal: ${formatPrice(order.subtotal)}`,
    order.discount > 0
      ? `  ${order.discountLabel ?? "Descuento"}: - ${formatPrice(order.discount)}`
      : null,
    `  ${order.envioLabel}: ${
      order.envioACoordinar
        ? "a coordinar"
        : order.shippingCost > 0
          ? formatPrice(order.shippingCost)
          : "Gratis"
    }`,
    `  TOTAL: ${formatPrice(order.total)}`,
  ].filter(Boolean);

  const destino = order.esRetiro
    ? `Retirás en:\n  ${order.envioDetalle ?? ""}`
    : `Enviamos a:\n  ${order.direccion ?? ""}`;

  return [
    `PEDIDO #${order.numero}`,
    "",
    ...lineas,
    "",
    ...montos,
    "",
    destino,
    order.notas ? `\nTu nota:\n  ${order.notas}` : "",
  ]
    .join("\n")
    .trimEnd();
}

function piePagina(site: SiteInfo): string {
  return [
    "",
    "—",
    `Si algo no cierra, respondé este mail o escribinos por WhatsApp al ${site.whatsapp}.`,
    `${site.url}  ·  @${site.instagram}`,
  ].join("\n");
}

// ------------------------------------------------------------
// 1 · Transferencia pendiente
// ------------------------------------------------------------
export function transferenciaEmail(
  order: MailOrder,
  site: SiteInfo,
  bank: BankInfo,
): { subject: string; html: string; text: string } {
  const dato = (k: string, v: string) =>
    `<tr>
      <td style="padding:4px 0;font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.ink};opacity:0.6;white-space:nowrap;">${escape(k)}</td>
      <td align="right" style="padding:4px 0 4px 16px;font-family:${MONO};font-size:13px;color:${COLORS.ink};word-break:break-all;">${escape(v)}</td>
    </tr>`;

  // El mismo mensaje que arma el botón de la pantalla de gracias: llega con
  // el número de pedido puesto, así del otro lado no hay que preguntar cuál es.
  const comprobanteUrl = whatsappLink(
    site,
    `¡Hola DZ Estudio! Soy ${order.nombre}.\nTe mando el comprobante de la transferencia del pedido #${order.numero}.`,
  );

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
    ${paragraph(`Cuando la hagas, mandanos el comprobante por <a href="${comprobanteUrl}" style="color:${COLORS.ink};font-weight:700;">WhatsApp al ${escape(site.whatsapp)}</a> y lo damos por cerrado.`)}
    ${paragraph(`<strong>Te lo reservamos 48 horas.</strong> Después vuelve a la tienda: las ediciones son cortas y hay gente esperando.`)}
    <div style="height:12px;"></div>
    ${orderDetail(order)}
  `;

  const text = [
    `Anotado, ${order.nombre}. Falta un paso.`,
    "",
    "Tu pedido quedó reservado. Para cerrarlo, transferí el total a esta cuenta:",
    "",
    `  Alias: ${bank.alias}`,
    `  CBU: ${bank.cbu}`,
    `  Titular: ${bank.titular}`,
    `  CUIT: ${bank.cuit}`,
    `  Banco: ${bank.banco}`,
    `  Monto exacto: ${formatPrice(order.total)}`,
    "",
    `Cuando la hagas, mandanos el comprobante por WhatsApp (${site.whatsapp}) y lo damos por cerrado.`,
    "",
    "Te lo reservamos 48 horas. Después vuelve a la tienda: las ediciones son cortas y hay gente esperando.",
    "",
    detalleTexto(order),
    piePagina(site),
  ].join("\n");

  return {
    subject: `Falta la transferencia — pedido #${order.numero}`,
    html: shell(inner, clientFooter(site)),
    text,
  };
}

// ------------------------------------------------------------
// 2 · Pago confirmado
// ------------------------------------------------------------
export function pagoConfirmadoEmail(
  order: MailOrder,
  site: SiteInfo,
): { subject: string; html: string; text: string } {
  const queSigue = order.esRetiro
    ? `Te avisamos por acá cuando esté listo para que lo pases a buscar por ${escape(site.retiro.direccion)}.`
    : "Lo preparamos en el depósito y te escribimos de nuevo cuando salga, con el código de seguimiento.";

  // El resumen dice "A coordinar" al lado del envío, pero eso no alcanza para
  // avisar que viene un segundo cobro: la clienta ya pagó y esto es lo único
  // que le queda por escrito.
  const avisoEnvio = order.envioACoordinar
    ? paragraph(
        "Lo que pagaste es el producto. El envío se cobra aparte: te escribimos por WhatsApp con el costo antes de despachar.",
      )
    : "";

  const inner = `
    ${heading(`¡Listo, ${order.nombre}!`, "Ya es tuyo.")}
    <div style="height:20px;"></div>
    ${paragraph("El pago entró. Empezamos a preparar tu pedido.")}
    ${paragraph(queSigue)}
    ${avisoEnvio}
    <div style="height:12px;"></div>
    ${orderDetail(order)}
    ${paragraph("Guardá este mail: acá está todo lo que pediste y cuánto pagaste.")}
  `;

  const text = [
    `¡Listo, ${order.nombre}! Ya es tuyo.`,
    "",
    "El pago entró. Empezamos a preparar tu pedido.",
    "",
    order.esRetiro
      ? `Te avisamos por acá cuando esté listo para que lo pases a buscar por ${site.retiro.direccion}.`
      : "Lo preparamos en el depósito y te escribimos de nuevo cuando salga, con el código de seguimiento.",
    ...(order.envioACoordinar
      ? [
          "",
          "Lo que pagaste es el producto. El envío se cobra aparte: te escribimos por WhatsApp con el costo antes de despachar.",
        ]
      : []),
    "",
    detalleTexto(order),
    "",
    "Guardá este mail: acá está todo lo que pediste y cuánto pagaste.",
    piePagina(site),
  ].join("\n");

  return {
    subject: `Pago confirmado — pedido #${order.numero}`,
    html: shell(inner, clientFooter(site)),
    text,
  };
}

// ------------------------------------------------------------
// 3 · Despachado (o listo para retirar)
// ------------------------------------------------------------
export function despachadoEmail(
  order: MailOrder,
  site: SiteInfo,
): { subject: string; html: string; text: string } {
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
         <p style="margin:0${site.retiro.horario ? " 0 14px" : ""};font-family:${SANS};font-size:15px;line-height:1.5;color:${COLORS.ink};font-weight:700;">${escape(site.retiro.direccion)}</p>
         ${
           site.retiro.horario
             ? `${label("Cuándo")}
         <p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.5;color:${COLORS.ink};">${escape(site.retiro.horario)}</p>`
             : ""
         }`,
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

  const text = [
    order.esRetiro
      ? `${order.nombre}, te espera.`
      : `${order.nombre}, va en camino.`,
    "",
    ...(order.esRetiro
      ? [
          "Tu pedido está armado y listo para retirar.",
          "",
          `  Dónde: ${site.retiro.direccion}`,
          ...(site.retiro.horario ? [`  Cuándo: ${site.retiro.horario}`] : []),
          "",
          "Antes de salir, escribinos por WhatsApp así te esperamos con todo listo.",
        ]
      : [
          `Tu pedido salió del depósito por ${order.envioLabel}.`,
          ...(order.trackingCode
            ? [
                "",
                `  Código de seguimiento: ${order.trackingCode}`,
                "  Cargalo en la web del correo. Puede tardar unas horas en aparecer.",
              ]
            : []),
          ...(order.direccion ? ["", `Va a ${order.direccion}.`] : []),
        ]),
    "",
    "Cuando llegue, si te sale una foto linda, mandala. Nos gusta ver dónde terminan.",
    "",
    detalleTexto(order),
    piePagina(site),
  ].join("\n");

  return {
    subject: order.esRetiro
      ? `Listo para retirar — pedido #${order.numero}`
      : `Tu pedido salió — #${order.numero}`,
    html: shell(inner + cierre, clientFooter(site)),
    text,
  };
}

// ------------------------------------------------------------
// 4 · Aviso interno: entró un pedido
//
// Va a quien administra la tienda, no a la clienta, así que habla en
// otro registro: datos, no marca. Lo que hace falta para actuar sin
// abrir nada —quién, cuánto, cómo paga, a dónde va— y un link al panel.
// Sale cuando entra una transferencia (todavía sin comprobante) o cuando
// Mercado Pago aprueba un pago; ver `nuevo-pedido` en index.ts.
// ------------------------------------------------------------
export function nuevoPedidoEmail(
  order: MailOrder,
  site: SiteInfo,
): { subject: string; html: string; text: string } {
  const panelUrl = `${site.url}/admin/ventas?orden=${order.id}`;

  // wa.me quiere código de país + 9, sin +, sin 0 y sin 15: el teléfono se
  // cargó a mano en el checkout y viene como sea.
  const digits = (order.telefono ?? "").replace(/\D/g, "");
  const waCliente =
    digits.length >= 8
      ? `https://wa.me/${digits.startsWith("54") ? digits : `549${digits.replace(/^0/, "")}`}`
      : null;

  const titulo = order.pagado ? "Pagado." : "Falta el comprobante.";
  const medio = order.pago === "mp" ? "Mercado Pago" : "Transferencia";

  const queSigue = order.pagado
    ? "Ya le llegó el mail de pago confirmado. Queda prepararlo y despacharlo."
    : "Cuando mande el comprobante, marcala como pagada en el panel: ahí le sale el mail de pago confirmado. La reserva es de 48 horas.";

  const entrega = order.esRetiro
    ? "Retira por el depósito"
    : `${order.envioLabel}${order.envioACoordinar ? " · cobrar aparte" : ""}${
        order.direccion ? ` → ${order.direccion}` : ""
      }`;

  const fila = (k: string, v: string) =>
    `<tr>
      <td style="padding:4px 12px 4px 0;font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.ink};opacity:0.6;white-space:nowrap;vertical-align:top;">${escape(k)}</td>
      <td style="padding:4px 0;font-family:${SANS};font-size:14px;line-height:1.5;color:${COLORS.ink};">${v}</td>
    </tr>`;

  const items = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:6px 0;font-family:${SANS};font-size:14px;color:${COLORS.ink};">${item.qty} × ${escape(item.name)}${item.variant ? ` <span style="opacity:0.6;">· ${escape(item.variant)}</span>` : ""}</td>
          <td align="right" style="padding:6px 0;font-family:${MONO};font-size:13px;color:${COLORS.ink};white-space:nowrap;">${escape(formatPrice(item.price * item.qty))}</td>
        </tr>`,
    )
    .join("");

  const inner = `
    ${heading(`Pedido #${order.numero}.`, titulo)}
    <div style="height:20px;"></div>
    ${block(
      order.pagado ? COLORS.verde : COLORS.amarillo,
      `${label(medio)}
       <p style="margin:0;font-family:${MONO};font-size:24px;font-weight:700;color:${COLORS.ink};">${escape(formatPrice(order.total))}</p>
       <p style="margin:10px 0 0;font-family:${SANS};font-size:14px;line-height:1.5;color:${COLORS.ink};">${escape(queSigue)}</p>`,
    )}
    ${block(
      COLORS.white,
      `${label("Quién")}
       <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
         ${fila("Nombre", escape(order.nombreCompleto))}
         ${fila("Email", `<a href="mailto:${escape(order.email)}" style="color:${COLORS.ink};">${escape(order.email)}</a>`)}
         ${fila(
           "Teléfono",
           order.telefono
             ? waCliente
               ? `<a href="${waCliente}" style="color:${COLORS.ink};font-weight:700;">${escape(order.telefono)}</a> <span style="opacity:0.6;">· abre WhatsApp</span>`
               : escape(order.telefono)
             : `<span style="opacity:0.6;">no cargó</span>`,
         )}
         ${fila("Entrega", escape(entrega))}
         ${order.notas ? fila("Nota", escape(order.notas)) : ""}
       </table>
       <div style="height:1px;background:${COLORS.ink};opacity:0.12;margin:18px 0;"></div>
       ${label("Qué")}
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
         ${items}
         ${order.discount > 0 ? money(order.discountLabel ?? "Descuento", `- ${formatPrice(order.discount)}`) : ""}
         ${money("Total", formatPrice(order.total), true)}
       </table>`,
    )}
    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate;">
      <tr><td style="border-radius:999px;background:${COLORS.ink};">
        <a href="${panelUrl}" style="display:inline-block;padding:14px 28px;font-family:${MONO};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.cream};text-decoration:none;">Abrir en el panel &#10022;</a>
      </td></tr>
    </table>
  `;

  const footer = `<p style="margin:0;font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.ink};opacity:0.5;">
            Aviso automático de la tienda &nbsp;&#10022;&nbsp; respondé y le escribís a la clienta
          </p>`;

  const text = [
    `Pedido #${order.numero}. ${titulo}`,
    "",
    `${medio} — ${formatPrice(order.total)}`,
    queSigue,
    "",
    `Nombre: ${order.nombreCompleto}`,
    `Email: ${order.email}`,
    `Teléfono: ${order.telefono ?? "no cargó"}${waCliente ? ` (${waCliente})` : ""}`,
    `Entrega: ${entrega}`,
    ...(order.notas ? [`Nota: ${order.notas}`] : []),
    "",
    ...order.items.map(
      (item) =>
        `  ${item.qty} x ${item.name}${item.variant ? ` (${item.variant})` : ""} — ${formatPrice(item.price * item.qty)}`,
    ),
    ...(order.discount > 0
      ? [`  ${order.discountLabel ?? "Descuento"}: - ${formatPrice(order.discount)}`]
      : []),
    `  TOTAL: ${formatPrice(order.total)}`,
    "",
    `Abrir en el panel: ${panelUrl}`,
    "",
    "—",
    "Aviso automático de la tienda. Respondé este mail y le escribís a la clienta.",
  ].join("\n");

  return {
    subject: `Nuevo pedido #${order.numero} — ${order.nombreCompleto}, ${formatPrice(order.total)} ${
      order.pagado ? "pagado" : "por transferencia"
    }`,
    html: shell(inner, footer),
    text,
  };
}
