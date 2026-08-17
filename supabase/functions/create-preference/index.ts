// ============================================================
// Edge Function: create-preference
// Crea una preferencia de pago en Mercado Pago (Checkout Pro).
// El Access Token NUNCA sale del servidor.
// La orden ya fue insertada por el frontend; acá la leemos con la
// service role key (fuente de verdad de montos) y armamos la preferencia.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { orderId } = await req.json();
    if (!orderId) return json({ error: "Falta orderId" }, 400);

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

    // Tope de cuotas: lo edita el panel (Métodos de pago). Si la fila no existe
    // todavía, caemos en los mismos valores que anuncia la tienda.
    const { data: pagos } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "pagos")
      .maybeSingle();

    const mpSettings = (pagos?.value as { mercadopago?: Record<string, number> })
      ?.mercadopago;
    const maxInstallments = Number(mpSettings?.maxInstallments) || 6;
    const defaultInstallments = Number(mpSettings?.installments) || 3;

    const accessToken = Deno.env.get("MP_ACCESS_TOKEN")!;
    const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5173";

    const items = (order.items as Array<{ name: string; qty: number; price: number }>).map(
      (it) => ({
        title: it.name,
        quantity: it.qty,
        unit_price: it.price,
        currency_id: "ARS",
      }),
    );

    // Mercado Pago no acepta ítems negativos, así que el descuento se reparte
    // proporcionalmente entre los productos. El redondeo que sobra se ajusta
    // en el primer ítem para que la suma sea exactamente order.total.
    const discount = Number(order.discount ?? 0);
    if (discount > 0 && items.length > 0) {
      const productsTotal = items.reduce(
        (sum, it) => sum + it.unit_price * it.quantity,
        0,
      );
      if (productsTotal > discount) {
        const factor = (productsTotal - discount) / productsTotal;
        items.forEach((it) => {
          it.unit_price = Math.round(it.unit_price * factor * 100) / 100;
        });
        const afterDiscount = items.reduce(
          (sum, it) => sum + it.unit_price * it.quantity,
          0,
        );
        const drift = productsTotal - discount - afterDiscount;
        if (drift !== 0) {
          items[0].unit_price =
            Math.round((items[0].unit_price + drift / items[0].quantity) * 100) /
            100;
        }
      }
    }

    // El envío va como ítem para que el total de MP coincida con order.total
    if (order.shipping_cost > 0) {
      items.push({
        title: "Envío",
        quantity: 1,
        unit_price: order.shipping_cost,
        currency_id: "ARS",
      });
    }

    const preference: Record<string, unknown> = {
      items,
      external_reference: order.id,
      payer: {
        email: order.customer_email,
        name: order.customer_name,
      },
      back_urls: {
        success: `${siteUrl}/checkout/exito`,
        failure: `${siteUrl}/checkout/error`,
        pending: `${siteUrl}/checkout/exito`,
      },
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
      statement_descriptor: "DZ ESTUDIO",
      payment_methods: {
        // Fuera "Cuotas sin tarjeta" (Mercado Crédito): las cuotas que queremos
        // ofrecer son las del banco emisor, no las que financia Mercado Pago.
        excluded_payment_types: [{ id: "consumer_credits" }],
        installments: maxInstallments,
        default_installments: Math.min(defaultInstallments, maxInstallments),
      },
    };

    // auto_return solo con https: MP lo rechaza si la back_url es localhost
    if (siteUrl.startsWith("https://")) {
      preference.auto_return = "approved";
    }

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preference),
    });

    const mp = await res.json();
    if (!res.ok) return json({ error: "Error de Mercado Pago", detail: mp }, 502);

    await supabase
      .from("orders")
      .update({ mp_preference_id: mp.id })
      .eq("id", order.id);

    return json({ init_point: mp.init_point, preference_id: mp.id });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
