import { lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Analytics from "./components/Analytics";
import RoutePrefetch from "./components/RoutePrefetch";
import ScrollToTop from "./components/ScrollToTop";
import StoreLayout from "./components/StoreLayout";
import AdminAuthProvider from "./components/admin/AdminAuthProvider";
import RequireAdmin from "./components/admin/RequireAdmin";
import { adminLoaders, pageLoaders } from "./lib/routes";
import Home from "./pages/Home";

// Home va en el bundle inicial: es la landing y la que más tráfico recibe,
// así que no conviene cobrarle un request extra. El resto baja on demand,
// y RoutePrefetch se adelanta cuando el visitante hace hover sobre el link.
const Tienda = lazy(pageLoaders.tienda);
const Producto = lazy(pageLoaders.producto);
const Checkout = lazy(pageLoaders.checkout);
const CheckoutExito = lazy(pageLoaders.checkoutExito);
const CheckoutError = lazy(pageLoaders.checkoutError);
const SobreNosotros = lazy(pageLoaders.sobreNosotros);
const Faq = lazy(pageLoaders.faq);
const Contacto = lazy(pageLoaders.contacto);
const Pedido = lazy(pageLoaders.pedido);
const NotFound = lazy(pageLoaders.notFound);

// Panel de administración: mismo criterio, pero además nunca se precarga.
const AdminLayout = lazy(adminLoaders.layout);
const AdminInicio = lazy(adminLoaders.inicio);
const AdminEstadisticas = lazy(adminLoaders.estadisticas);
const AdminProductos = lazy(adminLoaders.productos);
const AdminPrecios = lazy(adminLoaders.precios);
const AdminVentas = lazy(adminLoaders.ventas);
const AdminClientes = lazy(adminLoaders.clientes);
const AdminDescuentos = lazy(adminLoaders.descuentos);
const AdminMarketing = lazy(adminLoaders.marketing);
const AdminPagos = lazy(adminLoaders.pagos);
const AdminEnvios = lazy(adminLoaders.envios);
const AdminDistribucion = lazy(adminLoaders.distribucion);

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Analytics />
      <RoutePrefetch />
      <Routes>
        {/* ✦ Tienda */}
        <Route element={<StoreLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/tienda" element={<Tienda />} />
          <Route path="/producto/:slug" element={<Producto />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/exito" element={<CheckoutExito />} />
          <Route path="/checkout/error" element={<CheckoutError />} />
          <Route path="/sobre-nosotros" element={<SobreNosotros />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/pedido" element={<Pedido />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* ✧ Panel privado. El guard es la UI; los datos los cuida la RLS. */}
        <Route
          path="/admin"
          element={
            <AdminAuthProvider>
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            </AdminAuthProvider>
          }
        >
          <Route index element={<AdminInicio />} />
          <Route path="estadisticas" element={<AdminEstadisticas />} />
          <Route path="productos" element={<AdminProductos />} />
          <Route path="precios" element={<AdminPrecios />} />
          <Route path="ventas" element={<AdminVentas />} />
          <Route path="clientes" element={<AdminClientes />} />
          <Route path="descuentos" element={<AdminDescuentos />} />
          <Route path="marketing" element={<AdminMarketing />} />
          <Route path="pagos" element={<AdminPagos />} />
          <Route path="envios" element={<AdminEnvios />} />
          <Route path="distribucion" element={<AdminDistribucion />} />
          {/* Cualquier otra ruta de /admin vuelve al inicio del panel */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
