import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { OrderStatus, PaymentMethod } from "../types/admin";

export type OrderAlert = {
  id: string;
  customerName: string;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
  seen: boolean;
};

type OrderInsertRow = {
  id: string;
  customer_name: string;
  total: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  created_at: string;
};

const MAX_ALERTS = 30;
const TOAST_DURATION_MS = 8000;

/**
 * Se suscribe a los INSERT de `orders` por Supabase Realtime para avisar en
 * el momento que entra un pedido nuevo. Un solo canal para toda la sesión
 * del panel: se monta una vez en AdminLayout, no por pantalla.
 */
export function useOrderAlerts() {
  const queryClient = useQueryClient();
  const [alerts, setAlerts] = useState<OrderAlert[]>([]);
  const [toasts, setToasts] = useState<OrderAlert[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-inserts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const row = payload.new as OrderInsertRow;
          const alert: OrderAlert = {
            id: row.id,
            customerName: row.customer_name,
            total: row.total,
            paymentMethod: row.payment_method,
            status: row.status,
            createdAt: row.created_at,
            seen: false,
          };

          setAlerts((prev) => [alert, ...prev].slice(0, MAX_ALERTS));
          setToasts((prev) => [...prev, alert]);
          timers.current.set(
            alert.id,
            setTimeout(() => {
              setToasts((prev) => prev.filter((t) => t.id !== alert.id));
              timers.current.delete(alert.id);
            }, TOAST_DURATION_MS),
          );

          void queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
        },
      )
      .subscribe();

    const activeTimers = timers.current;
    return () => {
      void supabase.removeChannel(channel);
      activeTimers.forEach((timer) => clearTimeout(timer));
      activeTimers.clear();
    };
  }, [queryClient]);

  const unseenCount = alerts.filter((alert) => !alert.seen).length;

  const markAllSeen = useCallback(() => {
    setAlerts((prev) => prev.map((alert) => ({ ...alert, seen: true })));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  return { alerts, unseenCount, markAllSeen, toasts, dismissToast };
}
