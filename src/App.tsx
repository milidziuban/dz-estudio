import { BrowserRouter, Route, Routes } from "react-router-dom";
import Analytics from "./components/Analytics";
import CartDrawer from "./components/CartDrawer";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Marquee from "./components/Marquee";
import ScrollToTop from "./components/ScrollToTop";
import Checkout from "./pages/Checkout";
import CheckoutError from "./pages/CheckoutError";
import CheckoutExito from "./pages/CheckoutExito";
import Contacto from "./pages/Contacto";
import Faq from "./pages/Faq";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Producto from "./pages/Producto";
import SobreNosotros from "./pages/SobreNosotros";
import Tienda from "./pages/Tienda";

const marqueeItems = [
  "Envíos a todo el país",
  "Edición limitada",
  "Hecho en Argentina",
  "Mercado Pago + transferencia",
  "Textiles que se ven mejor con la comida encima",
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
        </main>
        <Footer />
      </div>
      <CartDrawer />
    </BrowserRouter>
  );
}
