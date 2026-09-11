import { useState } from "react";
import { Link } from "react-router-dom";
import { ORDER_STATUS_LABEL, timeAgo } from "../../lib/admin";
import { cn } from "../../lib/cn";
import { formatPrice } from "../../lib/format";
import type { Order } from "../../types/admin";
import AdminIcon from "./AdminIcon";

type NotificationBellProps = {
  alerts: Order[];
  esNuevo: (order: Order) => boolean;
  unseenCount: number;
  onOpen: () => void;
};

/** Lo que hay que saber del pago de un vistazo, sin abrir la orden. */
function estadoCorto(order: Order): string {
  const medio = order.paymentMethod === "mp" ? "Mercado Pago" : "Transferencia";
  if (order.status === "pending") {
    return order.paymentMethod === "transferencia"
      ? `${medio} · falta el comprobante`
      : `${medio} · pago en proceso`;
  }
  return `${medio} · ${ORDER_STATUS_LABEL[order.status].toLowerCase()}`;
}

export default function NotificationBell({
  alerts,
  esNuevo,
  unseenCount,
  onOpen,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  // Qué era nuevo al abrir. Se congela acá para que el resaltado se vea
  // mientras el desplegable está abierto: `onOpen` ya los marca como vistos.
  const [nuevosAlAbrir, setNuevosAlAbrir] = useState<Set<string>>(
    () => new Set(),
  );

  const toggle = () => {
    setOpen((prev) => {
      if (!prev) {
        setNuevosAlAbrir(
          new Set(alerts.filter(esNuevo).map((order) => order.id)),
        );
        onOpen();
      }
      return !prev;
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Notificaciones de ventas"
        className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-ink/5"
      >
        <AdminIcon name="campana" className="h-[18px] w-[18px] text-ink/70" />
        {unseenCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink px-1 font-mono text-[9px] font-bold text-cream">
            {unseenCount > 9 ? "9+" : unseenCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar notificaciones"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-2xl bg-white p-2 shadow-2xl">
            <p className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/65">
              Pedidos recientes
            </p>
            {alerts.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-ink/65">
                Todavía no hay novedades ✧
              </p>
            ) : (
              <ul className="max-h-96 space-y-0.5 overflow-y-auto">
                {alerts.map((order) => (
                  <li key={order.id}>
                    <Link
                      to={`/admin/ventas?orden=${order.id}`}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block rounded-xl px-3 py-2 transition-colors hover:bg-ink/5",
                        nuevosAlAbrir.has(order.id) && "bg-pink/5",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
                          {nuevosAlAbrir.has(order.id) && (
                            <span
                              aria-label="Nuevo"
                              className="h-1.5 w-1.5 shrink-0 rounded-full bg-pink"
                            />
                          )}
                          <span className="truncate">{order.customerName}</span>
                        </span>
                        <span className="shrink-0 font-mono text-xs text-ink">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-3">
                        <span className="truncate font-mono text-[10px] uppercase tracking-widest text-ink/65">
                          {estadoCorto(order)}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-ink/65">
                          {timeAgo(order.createdAt)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
