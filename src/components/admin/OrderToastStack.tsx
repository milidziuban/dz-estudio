import { Link } from "react-router-dom";
import { formatPrice } from "../../lib/format";
import type { OrderAlert } from "../../hooks/useOrderAlerts";

type OrderToastStackProps = {
  toasts: OrderAlert[];
  onDismiss: (id: string) => void;
};

export default function OrderToastStack({
  toasts,
  onDismiss,
}: OrderToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex w-80 max-w-[90vw] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="rounded-2xl bg-ink px-4 py-3 text-cream shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-pink">
                Nuevo pedido ✦
              </p>
              <p className="mt-1 truncate text-sm">
                {toast.customerName} — {formatPrice(toast.total)}
              </p>
            </div>
            <button
              type="button"
              aria-label="Cerrar aviso"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 text-cream/50 transition-colors hover:text-cream"
            >
              ✕
            </button>
          </div>
          <Link
            to="/admin/ventas"
            onClick={() => onDismiss(toast.id)}
            className="mt-2 inline-block font-mono text-[11px] uppercase tracking-widest text-cream/70 transition-colors hover:text-cream"
          >
            Ver pedido →
          </Link>
        </div>
      ))}
    </div>
  );
}
