import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Analytics from "./components/Analytics";
import CartDrawer from "./components/CartDrawer";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Marquee from "./components/Marquee";
import PageLoader from "./components/PageLoader";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";

// Home va en el bundle inicial: es la landing y la que más tráfico recibe,
// así que no conviene cobrarle un request extra. El resto baja on demand.
const Tienda = lazy(() => import("./pages/Tienda"));
const Producto = lazy(() => import("./pages/Producto"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CheckoutExito = lazy(() => import("./pages/CheckoutExito"));
const CheckoutError = lazy(() => import("./pages/CheckoutError"));
const SobreNosotros = lazy(() => import("./pages/SobreNosotros"));
const Faq = lazy(() => import("./pages/Faq"));
const Contacto = lazy(() => import("./pages/Contacto"));
const NotFound = lazy(() => import("./pages/NotFound"));

const marqueeItems = [
  "3 cuotas sin interés",
  "10% off pagando por transferencia",
  "10% llevando 2 almohadones",
  "Envíos a todo el país",
  "Retiro gratis en Santa Fe Capital",
];

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Analytics />
      <Marquee items={marqueeItems} />
      {/* offset por la marquesina fija */}
      <div className="pt-9">
        <Header />
        <main>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/tienda" element={<Tienda />} />
              <Route path="/producto/:slug" element={<Producto />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/exito" element={<CheckoutExito />} />
              <Route path="/checkout/error" element={<CheckoutError />} />
              <Route path="/sobre-nosotros" element={<SobreNosotros />} />
              <Route path="/faq" element={<Faq />} />
              <Route path="/contacto" element={<Contacto />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
      <CartDrawer />
    </BrowserRouter>
  );
}
