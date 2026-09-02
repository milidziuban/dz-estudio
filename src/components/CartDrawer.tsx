import { useEffect } from "react";
import { useCart } from "../hooks/useCart";
import { useProducts } from "../hooks/useProducts";
import { cartSubtotal, resolveCartItems } from "../lib/cart";
import { cn } from "../lib/cn";
import { formatPrice } from "../lib/format";
import {
  bestDiscount,
  comboFaltan,
  DEFAULT_PROMOS,
  INSTALLMENTS,
} from "../lib/promos";
import { useStoreSettings } from "../hooks/useStoreSettings";
import { cartWhatsappUrl } from "../lib/whatsapp";
import Button from "./Button";
import CartItemRow from "./CartItemRow";

export default function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const items = useCart((s) => s.items);
  const { data: products = [], isLoading } = useProducts();
  const { data: settings } = useStoreSettings();
  const promos = settings?.marketing.promos ?? DEFAULT_PROMOS;

  const resolved = resolveCartItems(items, products);
  const subtotal = cartSubtotal(resolved);
  const count = resolved.reduce((total, item) => total + item.qty, 0);
  // En el drawer todavía no se eligió el medio de pago: mostramos solo las
  // promos que ya están ganadas.
  const discount = bestDiscount(resolved, subtotal, false, promos);
  const faltan = comboFaltan(resolved, promos);
  const total = subtotal - (discount?.amount ?? 0);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  return (
    <div
      className={cn("fixed inset-0 z-50", !isOpen && "pointer-events-none")}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        aria-label="Cerrar carrito"
        tabIndex={isOpen ? 0 : -1}
        onClick={close}
        className={cn(
          "absolute inset-0 bg-ink/50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Carrito"
        className={cn(
          "absolute inset-y-0 right-0 flex w-[420px] max-w-[92vw] flex-col bg-cream shadow-2xl shadow-ink/20 transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <p className="font-mono text-sm font-medium uppercase tracking-widest">
            ✦ Tu carrito {count > 0 && `(${count})`}
          </p>
          <button
            type="button"
            aria-label="Cerrar carrito"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg transition-colors hover:bg-ink/5"
          >
            ✕
          </button>
        </div>

        {isLoading && items.length > 0 ? (
          <p
            className="flex-1 animate-pulse px-8 py-16 text-center font-mono text-sm uppercase tracking-widest"
            role="status"
          >
            ✦ Cargando…
          </p>
        ) : resolved.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
            <p className="font-serif text-2xl italic leading-snug">
              Tu carrito está vacío. Vamos a arreglar eso.
            </p>
            <Button to="/tienda" onClick={close}>
              Ver la tienda ✦
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-5">
              {resolved.map((item) => (
                <CartItemRow key={item.key} item={item} />
              ))}
            </ul>

            <div className="border-t border-ink/10 p-5">
              {faltan && (
                <p className="mb-4 rounded-xl bg-amarillo px-4 py-3 text-xs leading-relaxed">
                  ✦ Sumá {faltan.faltan} {faltan.noun} más y se te aplica{" "}
                  <strong>{promos.combo.percent}% de descuento</strong>.
                </p>
              )}

              <dl className="space-y-1.5 font-mono text-sm tracking-wider">
                <div className="flex justify-between">
                  <dt className="uppercase text-xs">Subtotal</dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
                {discount && (
                  <div className="flex justify-between gap-3 text-verde">
                    <dt className="text-xs uppercase">{discount.label}</dt>
                    <dd className="whitespace-nowrap">
                      −{formatPrice(discount.amount)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="uppercase text-xs">Envío</dt>
                  <dd className="text-xs">Se calcula al final</dd>
                </div>
                <div className="flex justify-between border-t border-ink/15 pt-2 text-base font-medium">
                  <dt className="uppercase">Total</dt>
                  <dd>{formatPrice(total)}</dd>
                </div>
              </dl>

              <p className="mt-2 text-xs text-ink/60">
                {INSTALLMENTS.detail}. Pagando por transferencia,{" "}
                {promos.transferencia.percent}% off.
              </p>

              <Button to="/checkout" onClick={close} className="mt-4 w-full">
                Ir al checkout ✦
              </Button>
              <a
                href={cartWhatsappUrl(resolved, subtotal, discount)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className="mt-2 flex w-full items-center justify-center rounded-full border border-ink px-8 py-3 font-mono text-xs font-medium uppercase tracking-widest transition-colors hover:bg-ink hover:text-cream"
              >
                O comprar por WhatsApp
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
