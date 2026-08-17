import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { SETTINGS_DEFAULTS, useStoreSettings } from "../hooks/useStoreSettings";
import CartDrawer from "./CartDrawer";
import Footer from "./Footer";
import Header from "./Header";
import Marquee from "./Marquee";
import PageLoader from "./PageLoader";

/** Chrome de la tienda: marquesina, header, footer y carrito.
 *  El panel de administración no pasa por acá — tiene su propio layout. */
export default function StoreLayout() {
  const { data: settings } = useStoreSettings();
  // Hasta que llega la config de la base, la marquesina muestra los mismos
  // textos que están en el código: no hay parpadeo de contenido distinto.
  const marquee = settings?.marketing.marquee?.length
    ? settings.marketing.marquee
    : SETTINGS_DEFAULTS.marketing.marquee;

  return (
    <>
      <Marquee items={marquee} />
      {/* offset por la marquesina fija */}
      <div className="pt-9">
        <Header />
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
