import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { OrderStatus, ShippingStatus } from "../types/admin";

export type TrackingItem = {
  name: string;
  qty: number;
  variant: string | null;
};

export type OrderTracking = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  shippingStatus: ShippingStatus;
  shippingMethod: string;
  trackingCode: string | null;
  total: number;
  items: TrackingItem[];
  /** Usó un cupón de envío gratis: el envío no se cobra aparte. */
  envioGratis: boolean;
};

type TrackingRow = {
  id: string;
  created_at: string;
  status: OrderStatus;
  shipping_status: ShippingStatus;
  shipping_method: string;
  tracking_code: string | null;
  total: number;
  items: TrackingItem[] | null;
  envio_gratis: boolean | null;
};

function mapTracking(row: TrackingRow): OrderTracking {
  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    shippingStatus: row.shipping_status,
    shippingMethod: row.shipping_method,
    trackingCode: row.tracking_code,
    total: row.total,
    items: row.items ?? [],
    envioGratis: row.envio_gratis ?? false,
  };
}

/** Busca una orden puntual por código corto + email, vía la función
 *  `get_order_tracking` (SECURITY DEFINER, no expone el resto de `orders`). */
export function useOrderTracking() {
  return useMutation({
    mutationFn: async ({
      code,
      email,
    }: {
      code: string;
      email: string;
    }): Promise<OrderTracking | null> => {
      const { data, error } = await supabase.rpc("get_order_tracking", {
        p_order_code: code,
        p_email: email,
      });
      if (error) throw error;
      const rows = data as TrackingRow[] | null;
      return rows && rows.length > 0 ? mapTracking(rows[0]) : null;
    },
  });
}

/** El total que guardó la base para un pedido recién hecho. La base recalcula
 *  precios, descuentos y envío al insertar: si algo cambió con la pestaña
 *  abierta, el monto que calculó el navegador ya no es el que se cobra, y en
 *  transferencia la clienta transfiere lo que lee en pantalla. */
export function useOrderTotal(code?: string, email?: string) {
  return useQuery({
    queryKey: ["order-total", code, email],
    enabled: Boolean(code && email),
    queryFn: async (): Promise<number | null> => {
      const { data, error } = await supabase.rpc("get_order_tracking", {
        p_order_code: code,
        p_email: email,
      });
      if (error) throw error;
      const rows = data as TrackingRow[] | null;
      return rows && rows.length > 0 ? Number(rows[0].total) : null;
    },
    staleTime: Infinity,
    retry: 1,
  });
}
