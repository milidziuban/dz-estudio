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

let lastPath: string | null = null;

export async function trackVisit(path: string): Promise<void> {
  // El panel no es tráfico de la tienda
  if (path.startsWith("/admin")) return;
  // StrictMode monta dos veces en desarrollo: sin esto, cada vista va doble
  if (path === lastPath) return;
  lastPath = path;

  const { id, isNew } = getSession();

  try {
    await supabase.from("page_views").insert({
      path: path.slice(0, 300),
      // El referrer solo tiene sentido en la primera vista de la sesión:
      // después es siempre la página anterior del propio sitio.
      referrer: isNew ? document.referrer || null : null,
      session_id: id,
      is_new_session: isNew,
    });
  } catch {
    // Que no se registre una visita nunca puede romper la tienda
  }
}
