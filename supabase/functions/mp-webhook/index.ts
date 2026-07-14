// ============================================================
// Edge Function: mp-webhook
// Recibe las notificaciones de Mercado Pago cuando cambia un pago.
// Consulta el pago real en la API de MP (no confía en el body) y
// actualiza el status de la orden.
// Deploy con --no-verify-jwt: MP no manda el header de auth de Supabase.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STATUS_MAP: Record<string, string> = {
  approved: "paid",
  rejected: "rejected",
  cancelled: "cancelled",
  refunded: "cancelled",
};

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    let paymentId =
      url.searchParams.get("data.id") ?? url.searchParams.get("id");
    let topic = url.searchParams.get("type") ?? url.searchParams.get("topic");

    if (req.method === "POST") {
      try {
        const body = await req.json();
        topic = topic ?? body.type ?? body.action;
        paymentId = paymentId ?? body?.data?.id;
      } catch {
        // sin body JSON: seguimos con los query params
      }
    }

    // Solo nos interesan notificaciones de pago
    if (topic && !String(topic).includes("payment")) {
      return new Response("ignored", { status: 200 });
    }
    if (!paymentId) return new Response("sin payment id", { status: 200 });

    const accessToken = Deno.env.get("MP_ACCESS_TOKEN")!;
    const payRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const payment = await payRes.json();
    if (!payRes.ok) return new Response("pago no encontrado", { status: 200 });

    const orderId = payment.external_reference;
    const status = STATUS_MAP[payment.status] ?? "pending";

    if (orderId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await supabase
        .from("orders")
        .update({ status, mp_payment_id: String(paymentId) })
        .eq("id", orderId);
    }

    // MP espera un 200 rápido para dar por entregada la notificación
    return new Response("ok", { status: 200 });
  } catch (e) {
    return new Response(String(e), { status: 200 });
  }
});
