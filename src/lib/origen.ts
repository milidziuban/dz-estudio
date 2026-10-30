/**
 * De dónde viene una visita y desde qué aparato.
 *
 * Hasta el 30/10/2026 la tienda guardaba solo el `referrer`, y casi la mitad
 * de las sesiones llegaban sin él: el navegador interno de Instagram y los
 * links de WhatsApp no lo mandan. Este módulo junta las otras pistas que sí
 * llegan —la etiqueta del link (utm_*), el id de click que le pega Meta o
 * Google, el navegador de la app— y las ordena en un origen que se lee de un
 * vistazo en el panel.
 *
 * Lo usan los dos lados: `visits.ts` para leer las pistas en el navegador del
 * visitante, y `admin-stats.ts` para clasificarlas en /admin/estadisticas.
 */

export type Device = "mobile" | "tablet" | "desktop";
export type InAppBrowser = "instagram" | "facebook" | "tiktok";
export type ClickId = "fbclid" | "gclid" | "ttclid";

export type Atribucion = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  clickId: ClickId | null;
  app: InAppBrowser | null;
  device: Device;
};

/** Los dominios donde vive la tienda de verdad. Las previews de Vercel y el
 *  localhost escriben en la misma base, y en octubre las pruebas de la rama
 *  de Pliego sumaron 76 visitas falsas a /pliego. Fuera de acá no se mide. */
const DOMINIOS_TIENDA = ["www.dz-estudio.com", "dz-estudio.com"];

/** Parámetro para probar la medición desde una preview: `?medir=1` prende la
 *  medición en esa pestaña. Queda en sessionStorage hasta cerrarla. */
const FORZAR_KEY = "dz-medir";

export function esTiendaReal(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get("medir") === "1") {
      sessionStorage.setItem(FORZAR_KEY, "1");
    }
    if (sessionStorage.getItem(FORZAR_KEY) === "1") return true;
  } catch {
    // Storage bloqueado: decide solo el dominio
  }
  return DOMINIOS_TIENDA.includes(window.location.hostname);
}

function limpiar(value: string | null, max = 100): string | null {
  const v = value?.trim().toLowerCase();
  return v ? v.slice(0, max) : null;
}

function leerApp(ua: string): InAppBrowser | null {
  if (/Instagram/i.test(ua)) return "instagram";
  if (/FBAN|FBAV|FB_IAB|FBIOS|Messenger/i.test(ua)) return "facebook";
  if (/musical_ly|BytedanceWebview|TikTok/i.test(ua)) return "tiktok";
  return null;
}

function leerDevice(ua: string): Device {
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|iPod|Android|IEMobile|Opera Mini/i.test(ua)) return "mobile";
  return "desktop";
}

/** Las pistas de origen de la página en la que se abrió la sesión. */
export function leerAtribucion(): Atribucion {
  const params = new URLSearchParams(window.location.search);
  const ua = navigator.userAgent || "";
  const clickId: ClickId | null = params.has("fbclid")
    ? "fbclid"
    : params.has("gclid")
      ? "gclid"
      : params.has("ttclid")
        ? "ttclid"
        : null;

  return {
    utmSource: limpiar(params.get("utm_source")),
    utmMedium: limpiar(params.get("utm_medium")),
    utmCampaign: limpiar(params.get("utm_campaign")),
    utmContent: limpiar(params.get("utm_content")),
    clickId,
    app: leerApp(ua),
    device: leerDevice(ua),
  };
}

// ── Clasificación, para el panel ──────────────────────────────

/** Lo que el panel sabe de la primera vista de una sesión. */
export type PistasDeOrigen = {
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  clickId: string | null;
  app: string | null;
};

/** Nombres cortos y en minúscula que se usan al armar links a mano. */
const FUENTES: Record<string, string> = {
  ig: "Instagram",
  instagram: "Instagram",
  fb: "Facebook",
  facebook: "Facebook",
  wa: "WhatsApp",
  whatsapp: "WhatsApp",
  tiktok: "TikTok",
  google: "Google",
  mail: "Mail",
  email: "Mail",
  newsletter: "Mail",
};

const SIN_DATO = "Sin dato";

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function hostDe(referrer: string): string | null {
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function fuenteDelReferrer(referrer: string | null): string | null {
  if (!referrer) return null;
  const host = hostDe(referrer);
  if (!host) return null;
  if (host.includes("dz-estudio")) return null; // vuelta al propio sitio
  if (host.includes("instagram")) return "Instagram";
  if (host.includes("facebook") || host === "fb.me" || host.startsWith("l.facebook"))
    return "Facebook";
  if (host.includes("google")) return "Google";
  if (host.includes("whatsapp") || host === "wa.me") return "WhatsApp";
  if (host.includes("tiktok")) return "TikTok";
  if (host === "t.co" || host.includes("twitter") || host === "x.com") return "X";
  if (host.includes("localhost") || host.includes("vercel.app")) return null;
  return host;
}

/**
 * El origen de una sesión, del dato más fiable al menos fiable:
 * etiqueta del link → app desde la que se abrió → referrer → id de click.
 *
 * `canal` es la segunda línea opcional ("bio", "historia"), y sale solo de la
 * etiqueta del link: es lo único que distingue la bio de una historia.
 */
export function clasificarOrigen(p: PistasDeOrigen): {
  fuente: string;
  canal: string | null;
} {
  if (p.utmSource) {
    const fuente = FUENTES[p.utmSource] ?? capitalizar(p.utmSource);
    return { fuente, canal: p.utmMedium };
  }
  if (p.app === "instagram") return { fuente: "Instagram", canal: null };
  if (p.app === "facebook") return { fuente: "Facebook", canal: null };
  if (p.app === "tiktok") return { fuente: "TikTok", canal: null };

  const delReferrer = fuenteDelReferrer(p.referrer);
  if (delReferrer) return { fuente: delReferrer, canal: null };

  if (p.clickId === "fbclid") return { fuente: "Instagram o Facebook", canal: null };
  if (p.clickId === "gclid") return { fuente: "Google", canal: null };
  if (p.clickId === "ttclid") return { fuente: "TikTok", canal: null };

  return { fuente: SIN_DATO, canal: null };
}

export const ORIGEN_SIN_DATO = SIN_DATO;

export const DEVICE_LABEL: Record<string, string> = {
  mobile: "Celular",
  tablet: "Tablet",
  desktop: "Compu",
};
