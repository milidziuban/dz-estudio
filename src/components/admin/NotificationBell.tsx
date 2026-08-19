import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";
import { formatPrice } from "../../lib/format";
import type { OrderAlert } from "../../hooks/useOrderAlerts";
import AdminIcon from "./AdminIcon";

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "recién";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
}

type NotificationBellProps = {
  alerts: OrderAlert[];
  unseenCount: number;
  onOpen: () => void;
};

export default function NotificationBell({
  alerts,
  unseenCount,
  onOpen,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    setOpen((prev) => {
      if (!prev) onOpen();
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
            <p className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40">
              Ventas recientes
            </p>
            {alerts.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-ink/50">
                Todavía no hay novedades ✧
              </p>
            ) : (
              <ul className="max-h-96 space-y-0.5 overflow-y-auto">
                {alerts.map((alert) => (
                  <li key={alert.id}>
                    <Link
                      to="/admin/ventas"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block rounded-xl px-3 py-2 transition-colors hover:bg-ink/5",
                        !alert.seen && "bg-pink/5",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm text-ink">
                          {alert.customerName}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-ink">
                          {formatPrice(alert.total)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-3">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
                          {alert.paymentMethod === "mp"
                            ? "Mercado Pago"
                            : "Transferencia"}
                        </span>
                        <span className="font-mono text-[10px] text-ink/40">
                          {timeAgo(alert.createdAt)}
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
