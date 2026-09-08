import { useMemo } from "react";
import { useAdminOrders } from "./useAdminOrders";
import { useAdminProducts } from "./useAdminProducts";
import { useVisits } from "./useVisits";
import {
  ordersIn,
  periodFor,
  productFunnel,
  visitsIn,
  type ProductFunnel,
} from "../lib/admin-stats";
import type { RangeId } from "../lib/admin";

/**
 * Vistas de ficha contra ventas, producto por producto, dentro del rango que
 * elige el panel.
 *
 * Las tres queries son las mismas que ya usan Estadísticas e Inicio (mismas
 * claves de react-query), así que montar este hook no agrega ni un pedido a
 * Supabase: reusa lo que está en caché y solo recorta y cruza en memoria.
 *
 * El recorte por fecha es el del rango y nada más — igual que la pantalla de
 * Ventas, donde los totales siguen el filtro de fechas y no el de estado.
 */
export function useProductFunnel(range: RangeId): {
  funnel: ProductFunnel;
  isLoading: boolean;
  error: unknown;
} {
  const products = useAdminProducts();
  const orders = useAdminOrders();
  const visits = useVisits(range);

  const allProducts = products.data;
  const allOrders = orders.data;
  const allVisits = visits.data;

  const funnel = useMemo(() => {
    // `useVisits` trae el rango más el período anterior (lo necesitan las
    // tarjetas para comparar): acá hay que quedarse solo con el actual.
    const period = periodFor(range, allOrders ?? [], allVisits ?? []);
    return productFunnel(
      allProducts ?? [],
      ordersIn(allOrders ?? [], period.from, period.to),
      visitsIn(allVisits ?? [], period.from, period.to),
    );
  }, [range, allProducts, allOrders, allVisits]);

  return {
    funnel,
    isLoading: products.isLoading || orders.isLoading || visits.isLoading,
    error: products.error ?? orders.error ?? visits.error,
  };
}
