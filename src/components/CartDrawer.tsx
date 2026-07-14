import { useEffect } from "react";
import { useCart } from "../hooks/useCart";
import { useProducts } from "../hooks/useProducts";
import {
  cartSubtotal,
  resolveCartItems,
  SHIPPING_ESTIMATE,
} from "../lib/cart";
import { cn } from "../lib/cn";
import { formatPrice } from "../lib/format";
import Button from "./Button";
import CartItemRow from "./CartItemRow";

export default function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const items = useCart((s) => s.items);
  const { data: products = [], isLoading } = useProducts();

  const resolved = resolveCartItems(items, products);
  const subtotal = cartSubtotal(resolved);
  const count = resolved.reduce((total, item) => total + item.qty, 0);

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
          "absolute inset-y-0 right-0 flex w-[420px] max-w-[92vw] flex-col border-l-[2.5px] border-ink bg-cream transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b-[2.5px] border-ink px-5 py-4">
          <p className="font-mono text-sm font-medium uppercase tracking-widest">
            ✦ Tu carrito {count > 0 && `(${count})`}
          </p>
          <button
            type="button"
            aria-label="Cerrar carrito"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-cream text-lg shadow-hard transition-transform hover:-translate-y-0.5"
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
              Tu carrito está más vacío que mesa de soltero. ¿Empezamos?
            </p>
            <Button to="/tienda" onClick={close}>
              Ver la tienda ✦
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-5">
              {resolved.map((item) => (
                <CartItemRow key={item.product.slug} item={item} />
              ))}
            </ul>

            <div className="border-t-[2.5px] border-ink p-5">
              <dl className="space-y-1.5 font-mono text-sm tracking-wider">
                <div className="flex justify-between">
                  <dt className="uppercase text-xs">Subtotal</dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="uppercase text-xs">Envío estimado</dt>
                  <dd>{formatPrice(SHIPPING_ESTIMATE)}</dd>
                </div>
                <div className="flex justify-between border-t-2 border-ink pt-2 text-base font-medium">
                  <dt className="uppercase">Total</dt>
                  <dd>{formatPrice(subtotal + SHIPPING_ESTIMATE)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-ink/60">
                El envío final se calcula en el checkout. Esto es un estimado
                optimista.
              </p>
              <Button to="/checkout" onClick={close} className="mt-4 w-full">
                Ir al checkout ✦
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
