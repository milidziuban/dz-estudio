import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { ShippingId } from "../lib/checkout";
import type {
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  ShippingAddress,
  ShippingStatus,
} from "../types/admin";

type OrderRow = {
  id: string;
  created_at: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  shipping_address: ShippingAddress;
  shipping_method: ShippingId;
  items: OrderItem[] | null;
  subtotal: number;
  discount: number | null;
  discount_label: string | null;
  shipping_cost: number;
  total: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  shipping_status: ShippingStatus | null;
  tracking_code: string | null;
  admin_notes: string | null;
  customer_notes: string | null;
  mp_payment_id: string | null;
};

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    createdAt: row.created_at,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    shippingAddress: row.shipping_address,
    shippingMethod: row.shipping_method,
    items: row.items ?? [],
    subtotal: row.subtotal,
    discount: row.discount ?? 0,
    discountLabel: row.discount_label,
    shippingCost: row.shipping_cost,
    total: row.total,
    paymentMethod: row.payment_method,
    status: row.status,
    // shipping_status es nuevo: las órdenes viejas lo tienen en null
    shippingStatus: row.shipping_status ?? "pendiente",
    trackingCode: row.tracking_code,
    adminNotes: row.admin_notes,
    customerNotes: row.customer_notes,
    mpPaymentId: row.mp_payment_id,
  };
}

/**
 * Todas las órdenes, de la más nueva a la más vieja.
 *
 * Se traen enteras y el filtrado por rango se hace en memoria: el dashboard,
 * ventas y clientes leen las mismas filas y así no repetimos tres queries
 * distintas. El límite de 2000 alcanza de sobra hoy; si la tienda crece hay que
 * pasar a filtrar por fecha en el servidor.
 */
export function useAdminOrders() {
  return useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data as OrderRow[]).map(mapOrder);
    },
    staleTime: 60 * 1000,
  });
}

export type OrderPatch = Partial<{
  status: OrderStatus;
  shippingStatus: ShippingStatus;
  trackingCode: string | null;
  adminNotes: string | null;
}>;

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: OrderPatch }) => {
      const row: Record<string, unknown> = {};
      if (patch.status !== undefined) row.status = patch.status;
      if (patch.shippingStatus !== undefined)
        row.shipping_status = patch.shippingStatus;
      if (patch.trackingCode !== undefined)
        row.tracking_code = patch.trackingCode || null;
      if (patch.adminNotes !== undefined)
        row.admin_notes = patch.adminNotes || null;

      const { error } = await supabase.from("orders").update(row).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });
}
