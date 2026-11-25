// ============================================================
// Edge Function: meta-ads
// Lee los anuncios de Meta (Marketing API, solo lectura) y deja una copia en
// limpio en meta_campanas, meta_diario, meta_publico y meta_sync, que es lo
// que muestra /admin/publicidad.
//
// Solo la puede llamar quien esté en la tabla `admins`: se verifica acá
// adentro con la sesión del que llama. El panel la llama al abrir la pantalla
// y con el botón "Actualizar".
//
// Secretos:
//   META_ADS_TOKEN    token de un usuario del sistema, con permiso ads_read
//                     y nada más. Sin él, responde { conectado: false }.
//   META_ADS_ACCOUNT  (opcional) id de la cuenta publicitaria, sin "act_".
//   META_API_VERSION  (opcional) versión de la API.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CUENTA = Deno.env.get("META_ADS_ACCOUNT") ?? "1021137270760625";
const VERSION = Deno.env.get("META_API_VERSION") ?? "v26.0";
const BASE = `https://graph.facebook.com/${VERSION}`;

/** Con los datos de hace menos que esto no se vuelve a molestar a Meta, salvo
 *  que se apriete "Actualizar". */
const FRESCO_MS = 30 * 60 * 1000;

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

type Accion = { action_type: string; value: string };
// deno-lint-ignore no-explicit-any
type Fila = Record<string, any>;

/** Trae todas las páginas de una consulta. El token va en el header y no en
 *  la URL, así no queda escrito en ningún log. */
async function leer(
  token: string,
  camino: string,
  params: Record<string, string>,
): Promise<Fila[]> {
  const filas: Fila[] = [];
  let after: string | null = null;

  // 40 páginas de 200 alcanzan para años de anuncios: es un freno, no un plan
  for (let pagina = 0; pagina < 40; pagina++) {
    const query = new URLSearchParams({ limit: "200", ...params });
    if (after) query.set("after", after);
    const res = await fetch(`${BASE}/${camino}?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message ?? `Meta respondió ${res.status}`);
    }
    filas.push(...(body.data ?? []));
    after = body.paging?.next ? (body.paging?.cursors?.after ?? null) : null;
    if (!after) break;
  }
  return filas;
}

/** El valor de la primera acción que exista. Meta manda la misma compra con
 *  varios nombres: se toma uno solo, nunca la suma. */
function accion(lista: Accion[] | undefined, ...tipos: string[]): number {
  for (const tipo of tipos) {
    const encontrada = lista?.find((a) => a.action_type === tipo);
    if (encontrada) return Number(encontrada.value) || 0;
  }
  return 0;
}

/** "Publicación de Instagram: Dupla Azul..." → sin el prefijo que Instagram
 *  le pone a todo lo que se promociona. */
function nombreLimpio(nombre: string): string {
  return (
    nombre
      .replace(/^(Publicaci[oó]n de Instagram|Instagram post):\s*/i, "")
      .trim() || nombre
  );
}

function soloFecha(iso: string | undefined): string | null {
  return iso ? iso.slice(0, 10) : null;
}

function estadoDe(c: Fila, fin: string | null): string {
  const estado = String(c.effective_status ?? "");
  const anuncios = (c.ads?.data ?? []) as Fila[];

  if (fin && new Date(fin).getTime() < Date.now()) return "completada";
  if (
    estado === "WITH_ISSUES" ||
    anuncios.some((a) =>
      ["DISAPPROVED", "WITH_ISSUES"].includes(a.effective_status),
    )
  ) {
    return "con_problema";
  }
  if (estado === "PAUSED" || estado === "ARCHIVED") return "pausada";
  if (anuncios.some((a) => a.effective_status === "ACTIVE")) return "activa";
  if (
    estado === "IN_PROCESS" ||
    anuncios.some((a) =>
      ["PENDING_REVIEW", "IN_PROCESS", "PREAPPROVED"].includes(
        a.effective_status,
      ),
    )
  ) {
    return "en_revision";
  }
  return estado === "ACTIVE" ? "activa" : "pausada";
}

function destinoDe(conjuntos: Fila[]): string {
  const metas = conjuntos.map((a) => String(a.optimization_goal ?? ""));
  const destinos = conjuntos.map((a) => String(a.destination_type ?? ""));
  if (
    destinos.some((d) => d.includes("INSTAGRAM_PROFILE")) ||
    metas.some((m) => m.includes("PROFILE"))
  ) {
    return "perfil";
  }
  if (
    metas.some((m) =>
      [
        "LINK_CLICKS",
        "LANDING_PAGE_VIEWS",
        "OFFSITE_CONVERSIONS",
        "VALUE",
      ].includes(m),
    )
  ) {
    return "web";
  }
  return "otro";
}

const LUGAR: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  messenger: "Messenger",
  audience_network: "Otras apps",
  threads: "Threads",
  whatsapp: "WhatsApp",
};

const SEXO: Record<string, string> = {
  female: "Mujeres",
  male: "Varones",
  unknown: "Sin dato",
};

/** Meta escribe algunas provincias sin acento y otras en inglés */
const PROVINCIA: Record<string, string> = {
  "Ciudad Autónoma de Buenos Aires": "CABA",
  "Buenos Aires F.D.": "CABA",
  "Distrito Federal": "CABA",
  "Entre Rios": "Entre Ríos",
  Cordoba: "Córdoba",
  Tucuman: "Tucumán",
  Neuquen: "Neuquén",
  "Rio Negro": "Río Negro",
  Unknown: "Sin dato",
};

function provincia(valor: string): string {
  const sinSufijo = valor.replace(/ Province$/, "");
  return PROVINCIA[sinSufijo] ?? sinSufijo;
}

function revisar(r: { error: { message: string } | null }) {
  if (r.error) throw new Error(r.error.message);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Solo POST" }, 405);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // ── Quién llama ─────────────────────────────────────────────
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer /i, "");
  const { data: sesion } = await supabase.auth.getUser(jwt);
  if (!sesion?.user) return json({ error: "Hay que iniciar sesión" }, 401);

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", sesion.user.id)
    .maybeSingle();
  if (!admin) return json({ error: "Solo para administradoras" }, 403);

  // ── Conexión ────────────────────────────────────────────────
  const token = Deno.env.get("META_ADS_TOKEN")?.trim();
  if (!token) return json({ conectado: false });

  let forzar = false;
  try {
    forzar = Boolean((await req.json())?.forzar);
  } catch {
    // sin body: lectura normal
  }

  const { data: ultima } = await supabase
    .from("meta_sync")
    .select("actualizado, origen, error")
    .maybeSingle();

  const fresco =
    ultima?.origen === "api" &&
    !ultima.error &&
    Date.now() - new Date(ultima.actualizado).getTime() < FRESCO_MS;
  if (fresco && !forzar) return json({ conectado: true, actualizado: false });

  try {
    // ── Lectura ───────────────────────────────────────────────
    const cuenta = `act_${CUENTA}`;
    const ahora = new Date().toISOString();

    const insights = (params: Record<string, string>) =>
      leer(token, `${cuenta}/insights`, { date_preset: "maximum", ...params });
    const desglose = (breakdowns: string) =>
      insights({ breakdowns, fields: "spend,impressions,actions" });

    const [campanas, diario, porCampana, total, edad, sexo, region, lugar] =
      await Promise.all([
        leer(token, `${cuenta}/campaigns`, {
          fields:
            "id,name,effective_status,start_time,stop_time,lifetime_budget,daily_budget," +
            "adsets{optimization_goal,destination_type,start_time,end_time,lifetime_budget,daily_budget}," +
            "ads{effective_status,creative{instagram_permalink_url}}",
          limit: "50",
        }),
        insights({
          level: "campaign",
          time_increment: "1",
          fields:
            "campaign_id,campaign_name,spend,impressions,actions,action_values",
        }),
        insights({ level: "campaign", fields: "campaign_id,reach" }),
        insights({ fields: "reach" }),
        desglose("age"),
        desglose("gender"),
        desglose("region"),
        desglose("publisher_platform"),
      ]);

    const alcance = new Map(
      porCampana.map((f) => [String(f.campaign_id), Number(f.reach) || 0]),
    );

    const filasCampanas = campanas.map((c) => {
      const conjuntos = (c.adsets?.data ?? []) as Fila[];
      const inicio = c.start_time ?? conjuntos[0]?.start_time;
      const fin = c.stop_time ?? conjuntos[0]?.end_time;
      // Los presupuestos de Meta vienen en centavos
      const centavos = Number(
        c.lifetime_budget ||
          c.daily_budget ||
          conjuntos.reduce(
            (n, a) => n + (Number(a.lifetime_budget || a.daily_budget) || 0),
            0,
          ),
      );
      const link = ((c.ads?.data ?? []) as Fila[])
        .map((a) => a.creative?.instagram_permalink_url)
        .find(Boolean);
      return {
        id: String(c.id),
        nombre: nombreLimpio(String(c.name)),
        estado: estadoDe(c, fin ?? null),
        destino: destinoDe(conjuntos),
        inicio: soloFecha(inicio),
        fin: soloFecha(fin),
        presupuesto: centavos ? centavos / 100 : null,
        alcance: alcance.get(String(c.id)) ?? 0,
        link: link ?? null,
        actualizado: ahora,
      };
    });

    // Una campaña borrada en Meta ya no está en la lista pero sí en los
    // números: sin su fila, el diario no tendría de dónde colgarse. Las que
    // ya estaban guardadas no se pisan.
    const conocidas = new Set(filasCampanas.map((c) => c.id));
    const borradas = new Map<string, Fila>();
    for (const f of diario) {
      const id = String(f.campaign_id);
      if (conocidas.has(id) || borradas.has(id)) continue;
      borradas.set(id, {
        id,
        nombre: nombreLimpio(String(f.campaign_name ?? id)),
        estado: "completada",
        destino: "otro",
        alcance: alcance.get(id) ?? 0,
      });
    }

    const filasDiario = diario.map((f) => ({
      campana_id: String(f.campaign_id),
      fecha: f.date_start,
      gasto: Number(f.spend) || 0,
      impresiones: Number(f.impressions) || 0,
      clics: accion(f.actions, "link_click"),
      visitas: accion(f.actions, "omni_landing_page_view", "landing_page_view"),
      interacciones: accion(f.actions, "post_engagement"),
      reacciones: accion(f.actions, "post_reaction"),
      guardados: accion(f.actions, "onsite_conversion.post_save"),
      carritos: accion(
        f.actions,
        "omni_add_to_cart",
        "offsite_conversion.fb_pixel_add_to_cart",
      ),
      checkouts: accion(
        f.actions,
        "omni_initiated_checkout",
        "offsite_conversion.fb_pixel_initiate_checkout",
      ),
      compras: accion(
        f.actions,
        "omni_purchase",
        "offsite_conversion.fb_pixel_purchase",
      ),
      valor_compras: accion(
        f.action_values,
        "omni_purchase",
        "offsite_conversion.fb_pixel_purchase",
      ),
    }));

    // Dos nombres de Meta pueden caer en la misma fila (dos grafías de CABA)
    const publico = new Map<string, Fila>();
    const sumar = (tipo: string, valor: string, f: Fila) => {
      const clave = `${tipo}|${valor}`;
      const fila = publico.get(clave) ?? {
        tipo,
        valor,
        gasto: 0,
        impresiones: 0,
        clics: 0,
      };
      fila.gasto = Math.round((fila.gasto + (Number(f.spend) || 0)) * 100) / 100;
      fila.impresiones += Number(f.impressions) || 0;
      fila.clics += accion(f.actions, "link_click");
      publico.set(clave, fila);
    };
    for (const f of edad) {
      sumar("edad", f.age === "Unknown" ? "Sin dato" : String(f.age), f);
    }
    for (const f of sexo) sumar("sexo", SEXO[f.gender] ?? String(f.gender), f);
    for (const f of region) sumar("provincia", provincia(String(f.region)), f);
    for (const f of lugar) {
      const p = String(f.publisher_platform);
      sumar("lugar", LUGAR[p] ?? p, f);
    }

    // ── Guardado ──────────────────────────────────────────────
    if (filasCampanas.length) {
      revisar(await supabase.from("meta_campanas").upsert(filasCampanas));
    }
    if (borradas.size) {
      revisar(
        await supabase
          .from("meta_campanas")
          .upsert([...borradas.values()], { ignoreDuplicates: true }),
      );
    }
    for (let i = 0; i < filasDiario.length; i += 500) {
      revisar(
        await supabase.from("meta_diario").upsert(filasDiario.slice(i, i + 500)),
      );
    }
    const filasPublico = [...publico.values()];
    if (filasPublico.length) {
      // Se reemplaza entero: lo que Meta dejó de informar se tiene que ir, si
      // no los porcentajes no cierran
      revisar(await supabase.from("meta_publico").delete().neq("valor", ""));
      revisar(await supabase.from("meta_publico").insert(filasPublico));
    }
    revisar(
      await supabase.from("meta_sync").upsert({
        id: true,
        actualizado: ahora,
        origen: "api",
        alcance_total: Number(total[0]?.reach) || null,
        error: null,
      }),
    );

    return json({ conectado: true, actualizado: true });
  } catch (e) {
    // El error queda guardado y los números viejos también: es mejor ver lo de
    // ayer con un aviso que una pantalla vacía.
    const mensaje = e instanceof Error ? e.message : String(e);
    await supabase.from("meta_sync").update({ error: mensaje }).eq("id", true);
    return json({ conectado: true, actualizado: false, error: mensaje });
  }
});
