// ============================================================
// Edge Function: shipping-quote
// Cotiza el envío en vivo por código postal. Hoy solo Correo Argentino
// (API de MiCorreo) — Andreani se suma cuando haya credenciales de API
// reales (las da el comercial de cuenta, no se autogestionan).
//
// Las credenciales de MiCorreo NUNCA salen del servidor. Si no están
// cargadas como secretos, la función responde "configured: false" en vez
// de fallar: el checkout cae al costo fijo cargado en el panel.
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

type CorreoRate = {
  deliveredType?: string;
  price?: number;
};

/**
 * MiCorreo: HTTP Basic (userToken/passwordToken) para pedir un JWT, y ese
 * JWT como Bearer en /rates. Si algo de esto no coincide con la doc que te
 * da MiCorreo al crear la cuenta, esta función lo loguea y devuelve
 * "no disponible" — no rompe el checkout.
 */
async function cotizarCorreoArgentino(params: {
  destinationCp: string;
  origenCp: string;
  weightGrams: number;
  paquete: { largoCm: number; anchoCm: number; altoCm: number };
}): Promise<{
  configured: boolean;
  sucursal: number | null;
  domicilio: number | null;
  error?: string;
}> {
  const customerId = Deno.env.get("CORREO_ARGENTINO_CUSTOMER_ID");
  const userToken = Deno.env.get("CORREO_ARGENTINO_USER_TOKEN");
  const passwordToken = Deno.env.get("CORREO_ARGENTINO_PASSWORD_TOKEN");

  if (!customerId || !userToken || !passwordToken) {
    return { configured: false, sucursal: null, domicilio: null };
  }

  const base =
    Deno.env.get("CORREO_ARGENTINO_ENV") === "prod"
      ? "https://api.correoargentino.com.ar/micorreo/v1"
      : "https://apitest.correoargentino.com.ar/micorreo/v1";

  try {
    const basicAuth = btoa(`${userToken}:${passwordToken}`);
    const tokenRes = await fetch(`${base}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
    });

    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      console.error("MiCorreo /token falló:", tokenRes.status, detail);
      return {
        configured: true,
        sucursal: null,
        domicilio: null,
        error: "No se pudo autenticar con Correo Argentino",
      };
    }

    const { token } = (await tokenRes.json()) as { token: string };

    const ratesRes = await fetch(`${base}/rates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerId,
        postalCodeOrigin: params.origenCp,
        postalCodeDestination: params.destinationCp,
        dimensions: [
          {
            weight: params.weightGrams,
            height: params.paquete.altoCm,
            width: params.paquete.anchoCm,
            length: params.paquete.largoCm,
            quantity: 1,
          },
        ],
      }),
    });

    if (!ratesRes.ok) {
      const detail = await ratesRes.text();
      console.error("MiCorreo /rates falló:", ratesRes.status, detail);
      return {
        configured: true,
        sucursal: null,
        domicilio: null,
        error: "Correo Argentino no devolvió tarifa para ese código postal",
      };
    }

    const data = (await ratesRes.json()) as { rates?: CorreoRate[] };
    const rates = data.rates ?? [];

    const cheapest = (deliveredType: string) =>
      rates
        .filter((r) => r.deliveredType === deliveredType && typeof r.price === "number")
        .reduce<number | null>(
          (min, r) => (min === null || r.price! < min ? r.price! : min),
          null,
        );

    return {
      configured: true,
      sucursal: cheapest("S"),
      domicilio: cheapest("D"),
    };
  } catch (e) {
    console.error("Error cotizando con Correo Argentino:", e);
    return {
      configured: true,
      sucursal: null,
      domicilio: null,
      error: "Error de conexión con Correo Argentino",
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { destinationCp, weightGrams } = await req.json();

    const cp = String(destinationCp ?? "").trim();
    if (cp.length < 4) return json({ error: "Código postal inválido" }, 400);

    const peso = Number(weightGrams);
    const pesoFinal = Number.isFinite(peso) && peso > 0 ? peso : 400;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: envios } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "envios")
      .maybeSingle();

    const settings = (envios?.value ?? {}) as {
      origenCp?: string;
      paquete?: { largoCm: number; anchoCm: number; altoCm: number };
    };
    const origenCp = settings.origenCp || "3000";
    const paquete = settings.paquete || { largoCm: 40, anchoCm: 30, altoCm: 10 };

    const correoArgentino = await cotizarCorreoArgentino({
      destinationCp: cp,
      origenCp,
      weightGrams: pesoFinal,
      paquete,
    });

    return json({ correoArgentino });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
