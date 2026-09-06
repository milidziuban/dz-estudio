/** Registro único de imports dinámicos de páginas.
 *
 *  Lo consumen `React.lazy` en App y el prefetch en hover. Tienen que ser
 *  las mismas funciones en los dos lados: si el prefetch importara por otro
 *  camino, Vite emitiría un chunk aparte y precargaríamos un archivo que
 *  después nadie usa. */
export const pageLoaders = {
  tienda: () => import("../pages/Tienda"),
  producto: () => import("../pages/Producto"),
  checkout: () => import("../pages/Checkout"),
  checkoutExito: () => import("../pages/CheckoutExito"),
  checkoutError: () => import("../pages/CheckoutError"),
  sobreNosotros: () => import("../pages/SobreNosotros"),
  faq: () => import("../pages/Faq"),
  contacto: () => import("../pages/Contacto"),
  pedido: () => import("../pages/Pedido"),
  notFound: () => import("../pages/NotFound"),
};

/** El panel va en chunks aparte y nunca se precarga: lo abre una sola persona
 *  y no tiene sentido que el visitante de la tienda baje ese código. */
export const adminLoaders = {
  layout: () => import("../components/admin/AdminLayout"),
  inicio: () => import("../pages/admin/Inicio"),
  estadisticas: () => import("../pages/admin/Estadisticas"),
  productos: () => import("../pages/admin/Productos"),
  precios: () => import("../pages/admin/Precios"),
  ventas: () => import("../pages/admin/Ventas"),
  clientes: () => import("../pages/admin/Clientes"),
  descuentos: () => import("../pages/admin/Descuentos"),
  contenido: () => import("../pages/admin/Contenido"),
  marketing: () => import("../pages/admin/Marketing"),
  pagos: () => import("../pages/admin/MetodosPago"),
  envios: () => import("../pages/admin/MetodosEnvio"),
  distribucion: () => import("../pages/admin/Distribucion"),
};

type PageKey = keyof typeof pageLoaders;

/** Qué página atiende un pathname. `/` no está: Home va en el bundle
 *  inicial, no hay nada que precargar. */
function pageFor(pathname: string): PageKey | null {
  if (pathname.startsWith("/producto/")) return "producto";
  switch (pathname) {
    case "/tienda":
      return "tienda";
    case "/checkout":
      return "checkout";
    case "/checkout/exito":
      return "checkoutExito";
    case "/checkout/error":
      return "checkoutError";
    case "/sobre-nosotros":
      return "sobreNosotros";
    case "/faq":
      return "faq";
    case "/contacto":
      return "contacto";
    case "/pedido":
      return "pedido";
    default:
      return null;
  }
}

const started = new Set<PageKey>();

/** Baja el chunk de la página que atiende `pathname`, una sola vez.
 *  Si falla (sin conexión, o un deploy que cambió los hashes) se olvida el
 *  intento: al navegar de verdad, React.lazy lo vuelve a pedir. */
export function prefetchPath(pathname: string): void {
  const key = pageFor(pathname);
  if (!key || started.has(key)) return;
  started.add(key);
  void pageLoaders[key]().catch(() => {
    started.delete(key);
  });
}
