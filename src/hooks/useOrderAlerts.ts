import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Order } from "../types/admin";
import { useAdminOrders } from "./useAdminOrders";

/** Cuántos pedidos lista la campanita. */
const MAX_ALERTS = 30;
const TOAST_DURATION_MS = 8000;

/**
 * Hasta cuándo se dan por vistos los pedidos, en este navegador. Se guarda
 * cuando se abre la campanita. La primera vez que se entra desde un
 * dispositivo se toma "las últimas 24 horas" como no visto: es lo que
 * conviene ver al abrir el panel después de una noche con ventas.
 */
const SEEN_KEY = "dz-admin-alerts-seen-at";
const PRIMERA_VEZ_MS = 24 * 60 * 60 * 1000;

function leerVistoHasta(): number {
  try {
    const stored = localStorage.getItem(SEEN_KEY);
    const parsed = stored ? Number(stored) : NaN;
    if (Number.isFinite(parsed)) return parsed;
  } catch {
    // Storage bloqueado: se comporta como primera vez
  }
  return Date.now() - PRIMERA_VEZ_MS;
}

function guardarVistoHasta(ms: number): void {
  try {
    localStorage.setItem(SEEN_KEY, String(ms));
  } catch {
    // Sin storage, la próxima carga vuelve a marcar como nuevo lo de las
    // últimas 24 horas. Molesto, no grave.
  }
}

type OrderInsertRow = {
  id: string;
  customer_name: string;
  total: number;
};

export type Toast = {
  id: string;
  customerName: string;
  total: number;
};

/**
 * Los avisos de ventas del panel.
 *
 * La lista de la campanita sale de la base —los mismos pedidos que ve
 * Ventas—, así que muestra lo que entró con el panel cerrado. Antes vivía
 * solo en memoria: un pedido que entraba con el panel cerrado no se veía
 * en ningún lado, y eso es exactamente lo que pasó con la primera venta
 * real, el 10/09. Realtime sigue para lo inmediato: el aviso flotante
 * cuando entra un pedido con el panel abierto, y refrescar la lista de
 * órdenes en cuanto algo cambia (un pago que aprueba Mercado Pago, por
 * ejemplo) sin esperar al próximo refetch.
 *
 * Un solo canal para toda la sesión del panel: se monta una vez en
 * AdminLayout, no por pantalla.
 */
export function useOrderAlerts() {
  const queryClient = useQueryClient();
  const orders = useAdminOrders();
  const [vistoHasta, setVistoHasta] = useState(leerVistoHasta);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          void queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });

          if (payload.eventType !== "INSERT") return;
          const row = payload.new as OrderInsertRow;
          const toast: Toast = {
            id: row.id,
            customerName: row.customer_name,
            total: row.total,
          };
          setToasts((prev) => [...prev, toast]);
          timers.current.set(
            toast.id,
            setTimeout(() => {
              setToasts((prev) => prev.filter((t) => t.id !== toast.id));
              timers.current.delete(toast.id);
            }, TOAST_DURATION_MS),
          );
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

  const alerts: Order[] = useMemo(
    () => (orders.data ?? []).slice(0, MAX_ALERTS),
    [orders.data],
  );

  const esNuevo = useCallback(
    (order: Order) => new Date(order.createdAt).getTime() > vistoHasta,
    [vistoHasta],
  );

  const unseenCount = alerts.filter(esNuevo).length;

  const markAllSeen = useCallback(() => {
    const ahora = Date.now();
    guardarVistoHasta(ahora);
    setVistoHasta(ahora);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  return { alerts, esNuevo, unseenCount, markAllSeen, toasts, dismissToast };
}
