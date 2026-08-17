import { useEffect, type ReactNode } from "react";
import { cn } from "../../lib/cn";

type AdminDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Barra fija abajo, para los botones de guardar */
  footer?: ReactNode;
  wide?: boolean;
};

/** Panel lateral para editar una fila sin perder de vista el listado.
 *  Mismo registro visual que el CartDrawer de la tienda. */
export default function AdminDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide,
}: AdminDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      className={cn("fixed inset-0 z-50", !open && "pointer-events-none")}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Cerrar"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-ink/50 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute inset-y-0 right-0 flex w-full flex-col bg-cream shadow-2xl shadow-ink/20 transition-transform duration-300",
          wide ? "sm:w-[640px]" : "sm:w-[480px]",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 px-5 py-4">
          <div>
            <p className="font-mono text-sm font-medium uppercase tracking-widest">
              {title}
            </p>
            {subtitle && (
              <p className="mt-1 text-xs text-ink/55">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg transition-colors hover:bg-ink/5"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer && (
          <div className="border-t border-ink/10 px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
