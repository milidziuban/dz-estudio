import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SETTINGS_DEFAULTS, useStoreSettings } from "../hooks/useStoreSettings";
import CartDrawer from "./CartDrawer";
import Footer from "./Footer";
import Header from "./Header";
import Marquee from "./Marquee";
import PageLoader from "./PageLoader";
import { esRutaPliego } from "../lib/pliego";

/** Chrome de la tienda: marquesina, header, footer y carrito.
 *  El panel de administración no pasa por acá — tiene su propio layout. */
export default function StoreLayout() {
  const { data: settings } = useStoreSettings();
  const { pathname } = useLocation();
  // Pliego va sin marquesina: sus promos son de los textiles y Pliego vende
  // calma visual. El header y el carrito siguen siendo los de la tienda.
  const conMarquesina = !esRutaPliego(pathname);
  // Hasta que llega la config de la base, la marquesina muestra los mismos
  // textos que están en el código: no hay parpadeo de contenido distinto.
  const marquee = settings?.marketing.marquee?.length
    ? settings.marketing.marquee
    : SETTINGS_DEFAULTS.marketing.marquee;

  return (
    <>
      {conMarquesina && <Marquee items={marquee} />}
      {/* offset por la marquesina fija (solo desktop: en mobile scrollea) */}
      <div className={conMarquesina ? "md:pt-9" : undefined}>
        <Header conMarquesina={conMarquesina} />
        <main>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
      <CartDrawer />
    </>
  );
}
