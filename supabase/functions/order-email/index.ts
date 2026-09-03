// ============================================================
// Edge Function: order-email
// Manda los tres mails del pedido con Resend.
//
// Quien llama solo dice QUÉ orden y CUÁL de los tres mails. El contenido
// (precios, datos bancarios, dirección) sale siempre de la base con
// service role: nada de lo que se manda viene del body.
//
// Cada mail sale una sola vez. La tabla `order_emails` tiene clave
// primaria (order_id, kind) y se inserta ANTES de mandar: si la fila ya
// existe, no se manda de nuevo. Eso cubre los reintentos de Mercado Pago
// y los guardados repetidos del panel. Si Resend falla, la fila se borra
// para que el próximo intento sí salga.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  type BankInfo,
  despachadoEmail,
  type MailOrder,
  pagoConfirmadoEmail,
  type SiteInfo,
  transferenciaEmail,
} from "./templates.ts";

const KINDS = ["transferencia", "pago-confirmado", "despachado"] as const;
type Kind = (typeof KINDS)[number];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

/** El pedido que ve la clienta: los 8 primeros del uuid, como en la web. */
function orderNumber(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { orderId, kind } = (await req.json()) as {
      orderId?: string;
      kind?: Kind;
    };

    if (!orderId) return json({ error: "Falta orderId" }, 400);
    if (!kind || !KINDS.includes(kind)) {
      return json({ error: "kind inválido" }, 400);
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      // Sin la clave no rompemos el checkout: la compra ya está guardada.
      return json({ skipped: true, reason: "RESEND_API_KEY no configurada" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) return json({ error: "Orden no encontrada" }, 404);

    // Cada mail tiene su condición en la base. Así el mail de "pago
    // confirmado" no se puede disparar sobre una orden impaga aunque
    // alguien llame a la función con la anon key.
    const permitido =
      (kind === "transferencia" && order.payment_method === "transferencia") ||
      (kind === "pago-confirmado" && order.status === "paid") ||
      (kind === "despachado" && order.shipping_status === "despachado");

    if (!permitido) {
      return json({ skipped: true, reason: `la orden no está para ${kind}` });
    }

    // --- Configuración de la tienda (la misma que edita el panel) ---
    const { data: rows } = await supabase
      .from("store_settings")
      .select("key, value")
      .in("key", ["pagos", "marketing", "envios", "distribucion"]);

    const settings = Object.fromEntries(
      (rows ?? []).map((r) => [r.key, r.value as Record<string, unknown>]),
    );

    const bank = ((settings.pagos as Record<string, unknown>)
      ?.transferencia ?? {}) as BankInfo;

    const marketing = (settings.marketing ?? {}) as {
      instagram?: string;
      whatsapp?: string;
    };

    const enviosOptions = ((settings.envios as Record<string, unknown>)
      ?.options ?? []) as Array<{
      id: string;
      label?: string;
      detail?: string;
    }>;
    const envioOption = enviosOptions.find(
      (o) => o.id === order.shipping_method,
    );

    const retiroLocation = (
      ((settings.distribucion as Record<string, unknown>)?.locations ??
        []) as Array<{
        nombre?: string;
        direccion?: string;
        horario?: string;
        retiro?: boolean;
      }>
    ).find((l) => l.retiro);

    const whatsapp = marketing.whatsapp ?? "";
    const instagram = marketing.instagram ?? "dzestudio_";
    const site: SiteInfo = {
      url: Deno.env.get("SITE_URL") ?? "https://www.dz-estudio.com",
      instagram,
      instagramUrl: `https://instagram.com/${instagram}`,
      whatsapp,
      // wa.me quiere código de país + 9 de celular, sin +, sin 0 y sin 15
      whatsappUrl: `https://wa.me/549${whatsapp.replace(/\D/g, "")}`,
      retiro: {
        nombre: retiroLocation?.nombre ?? "Depósito Santa Fe Ciudad",
        direccion:
          retiroLocation?.direccion ??
          "Tacuarí 7618, Guadalupe, Santa Fe Capital",
        horario: retiroLocation?.horario ?? "Lunes a viernes de 9 a 18",
      },
    };

    const addr = (order.shipping_address ?? {}) as {
      direccion?: string;
      ciudad?: string;
      provincia?: string;
      cp?: string;
    };
    const esRetiro = order.shipping_method === "retiro";
    const direccion = esRetiro
      ? null
      : [
          addr.direccion,
          addr.ciudad,
          addr.provincia,
          addr.cp ? `CP ${addr.cp}` : null,
        ]
          .filter(Boolean)
          .join(", ");

    const mailOrder: MailOrder = {
      numero: orderNumber(order.id),
      nombre: firstName(order.customer_name),
      items: (order.items ?? []).map(
        (it: {
          name: string;
          variant: string | null;
          qty: number;
          price: number;
        }) => ({
          name: it.name,
          variant: it.variant ?? null,
          qty: it.qty,
          price: it.price,
        }),
      ),
      subtotal: Number(order.subtotal) || 0,
      discount: Number(order.discount) || 0,
      discountLabel: order.discount_label ?? null,
      shippingCost: Number(order.shipping_cost) || 0,
      total: Number(order.total) || 0,
      envioLabel: envioOption?.label ?? order.shipping_method,
      envioDetalle: envioOption?.detail ?? null,
      esRetiro,
      direccion,
      trackingCode: order.tracking_code ?? null,
      notas: order.customer_notes ?? null,
    };

    const { subject, html, text } =
      kind === "transferencia"
        ? transferenciaEmail(mailOrder, site, bank)
        : kind === "pago-confirmado"
          ? pagoConfirmadoEmail(mailOrder, site)
          : despachadoEmail(mailOrder, site);

    // --- Reserva del envío: si ya está, este mail ya salió ---
    const { error: dupe } = await supabase
      .from("order_emails")
      .insert({ order_id: order.id, kind });

    if (dupe) {
      // 23505 = unique_violation: ya se había mandado, no es un error.
      if (dupe.code === "23505") return json({ skipped: true, reason: "ya se mandó" });
      return json({ error: "No se pudo registrar el envío", detail: dupe }, 500);
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM") ?? "DZ Estudio <pedidos@dz-estudio.com>",
        to: [order.customer_email],
        reply_to: Deno.env.get("RESEND_REPLY_TO") ?? undefined,
        subject,
        html,
        // El texto plano viaja junto al HTML. Un mail que va solo en HTML es
        // una de las señales que más empuja a Gmail a mandarlo a spam.
        text,
      }),
    });

    if (!res.ok) {
      // Liberamos la reserva para que el próximo intento pueda mandarlo.
      await supabase
        .from("order_emails")
        .delete()
        .eq("order_id", order.id)
        .eq("kind", kind);
      return json({ error: "Resend rechazó el mail", detail: await res.text() }, 502);
    }

    const sent = await res.json();
    return json({ sent: true, id: sent.id, kind });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
