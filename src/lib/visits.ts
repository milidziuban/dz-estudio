import { esTiendaReal, leerAtribucion } from "./origen";
import { supabase } from "./supabase";

/**
 * Registro propio de visitas.
 *
 * GA4 sigue siendo la herramienta de análisis, pero sus números no se pueden
 * leer desde el panel sin montar la API de reporting. Estas filas son las que
 * alimentan las tarjetas de visitas y la conversión de /admin.
 *
 * Nada de esto identifica a nadie: el id de sesión vive en sessionStorage y se
 * borra al cerrar la pestaña.
 */

const SESSION_KEY = "dz-session";

/** Marca que deja el panel en el navegador de quien administra. Vive en
 *  localStorage y no se borra al cerrar sesión: cuando Mili recorre la tienda
 *  para revisarla, sus visitas y sus "agregar al carrito" no son tráfico. */
const ADMIN_KEY = "dz-admin";

export function marcarNavegadorAdmin(): void {
  try {
    localStorage.setItem(ADMIN_KEY, "1");
  } catch {
    // Storage bloqueado: se cuentan sus visitas, como antes.
  }
}

export function esNavegadorAdmin(): boolean {
  try {
    return localStorage.getItem(ADMIN_KEY) === "1";
  } catch {
    return false;
  }
}

function getSession(): { id: string; isNew: boolean } {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return { id: existing, isNew: false };
    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
    return { id, isNew: true };
  } catch {
    // Navegación privada con storage bloqueado: la visita se cuenta igual,
    // pero cada página queda como una sesión distinta.
    return { id: crypto.randomUUID(), isNew: true };
  }
}

/** El id de sesión de esta pestaña, para que los eventos del embudo
 *  (`store-events.ts`) se puedan cruzar con las visitas.
 *
 *  Lo llama siempre algo que pasa después del primer render —un click en
 *  "Agregar al carrito", entrar al checkout—, así que para cuando corre, el
 *  `trackVisit` del montaje ya resolvió la sesión y ya decidió si mandaba el
 *  referrer. */
export function sessionId(): string {
  return getSession().id;
}

let lastPath: string | null = null;

/** Si esta pestaña se mide: ni el panel, ni el navegador de quien lo
 *  administra, ni las previews de Vercel o el localhost (ver `esTiendaReal`). */
export function seMide(): boolean {
  return !esNavegadorAdmin() && esTiendaReal();
}

export async function trackVisit(path: string): Promise<void> {
  // El panel no es tráfico de la tienda
  if (path.startsWith("/admin")) return;
  // Ni quien lo administra, ni una preview de prueba
  if (!seMide()) return;
  // StrictMode monta dos veces en desarrollo: sin esto, cada vista va doble
  if (path === lastPath) return;
  lastPath = path;

  const { id, isNew } = getSession();

  // El origen solo tiene sentido en la primera vista de la sesión: después
  // la URL ya no trae la etiqueta del link y el referrer es el propio sitio.
  const origen = isNew ? leerAtribucion() : null;

  try {
    await supabase.from("page_views").insert({
      path: path.slice(0, 300),
      referrer: isNew ? document.referrer || null : null,
      session_id: id,
      is_new_session: isNew,
      ...(origen
        ? {
            utm_source: origen.utmSource,
            utm_medium: origen.utmMedium,
            utm_campaign: origen.utmCampaign,
            utm_content: origen.utmContent,
            click_id: origen.clickId,
            app: origen.app,
            device: origen.device,
          }
        : {}),
    });
  } catch {
    // Que no se registre una visita nunca puede romper la tienda
  }
}
