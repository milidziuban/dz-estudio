import { useMutation } from "@tanstack/react-query";
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
