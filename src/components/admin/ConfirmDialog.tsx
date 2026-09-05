import { useEffect } from "react";
import Button from "../Button";
import { cn } from "../../lib/cn";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Pinta el botón de confirmar en naranja, para acciones irreversibles */
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Reemplazo de `window.confirm` con el mismo registro visual que el resto
 *  del panel — el diálogo nativo del browser desentona con todo lo demás. */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive,
  pending,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={cancelLabel}
        onClick={onCancel}
        className="absolute inset-0 bg-ink/50"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm rounded-2xl bg-cream p-6 shadow-2xl shadow-ink/20"
      >
        <p className="font-mono text-sm font-medium uppercase tracking-widest">
          {title}
        </p>
        {description && (
          <p className="mt-2 text-xs leading-relaxed text-ink/65">
            {description}
          </p>
        )}
        <div className="mt-5 flex gap-3">
          <Button
            className={cn(
              "flex-1 disabled:opacity-50",
              destructive && "bg-orange hover:bg-orange/80",
            )}
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? "Un momento…" : confirmLabel}
          </Button>
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
