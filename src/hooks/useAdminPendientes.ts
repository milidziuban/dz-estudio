import { useMemo } from "react";
import { isPaid, pendingStage } from "../lib/admin";
import { stockLines } from "../lib/admin-stats";
import { esHoy, pendiente } from "../lib/contenido";
import { useAdminOrders } from "./useAdminOrders";
import { useAdminProducts } from "./useAdminProducts";
import { useContentPosts } from "./useContentPosts";
import { useStoreSettings } from "./useStoreSettings";

export type Pendientes = {
  /** Cobradas, salen por transportista y todavía no se despacharon */
  porDespachar: number;
  /** Cobradas, se retiran en el depósito y todavía no se entregaron */
  porEntregar: number;
  /** Transferencias con la reserva de 48 h en pie: hay que mirar el banco */
  porConfirmar: number;
  /** Transferencias que pasaron las 48 h sin acreditarse */
  vencidas: number;
  /** Líneas de stock con control, por encima de 0 y en o bajo el umbral */
  pocoStock: number;
  /** Líneas con control en 0 */
  agotadas: number;
  /** Piezas del calendario para hoy que todavía no salieron */
  posteosHoy: number;
  /** El umbral de poco stock con el que se contó */
  umbral: number;
  isLoading: boolean;
};

/**
 * Lo que espera una acción tuya, contado sobre todas las órdenes y no sobre un
 * rango: un pedido sin despachar del mes pasado sigue siendo para hoy.
 *
 * Lo usan el sidebar (los numeritos al lado de cada sección) e Inicio ("Para
 * hacer hoy"). Las tres consultas son las mismas que ya hacen esas pantallas,
 * así que react-query las comparte y no suma pedidos a Supabase.
 */
export function useAdminPendientes(): Pendientes {
  const orders = useAdminOrders();
  const products = useAdminProducts();
  const posts = useContentPosts();
  const { data: settings } = useStoreSettings();

  const umbral = settings?.distribucion.lowStockThreshold ?? 3;

  return useMemo(() => {
    const todas = orders.data ?? [];
    const ahora = Date.now();

    const pagadas = todas.filter(isPaid);
    const enCamino = (estado: string) =>
      estado === "pendiente" || estado === "preparando";

    const lineas = stockLines(products.data ?? []).filter(
      (line) => line.stock !== null,
    );

    return {
      porDespachar: pagadas.filter(
        (o) => o.shippingMethod !== "retiro" && enCamino(o.shippingStatus),
      ).length,
      // Un retiro no se despacha: pasa de pendiente a entregado cuando lo
      // vienen a buscar. "Despachado" en un retiro también es "todavía no".
      porEntregar: pagadas.filter(
        (o) => o.shippingMethod === "retiro" && o.shippingStatus !== "entregado",
      ).length,
      porConfirmar: todas.filter((o) => pendingStage(o, ahora) === "reservada")
        .length,
      vencidas: todas.filter((o) => pendingStage(o, ahora) === "vencida")
        .length,
      pocoStock: lineas.filter(
        (line) => (line.stock ?? 0) > 0 && (line.stock ?? 0) <= umbral,
      ).length,
      agotadas: lineas.filter((line) => line.stock === 0).length,
      posteosHoy: (posts.data ?? []).filter(
        (post) => pendiente(post) && esHoy(new Date(post.scheduledAt)),
      ).length,
      umbral,
      isLoading: orders.isLoading || products.isLoading,
    };
  }, [orders.data, orders.isLoading, products.data, products.isLoading, posts.data, umbral]);
}
