import { Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { useHideOnScroll } from "../hooks/useHideOnScroll";
import { cartCount } from "../lib/cart";
import { cn } from "../lib/cn";

const NAV_LINKS: { label: string; short?: string; to: string }[] = [
  { label: "Todo", to: "/tienda" },
  {
    label: "Almohadones",
    short: "Almohadones",
    to: "/tienda?categoria=almohadones",
  },
  {
    label: "Individuales",
    short: "Individuales",
    to: "/tienda?categoria=individuales",
  },
];

export default function Header() {
  const items = useCart((s) => s.items);
  const openCart = useCart((s) => s.open);
  const count = cartCount(items);
  // En mobile la fila de categorías se esconde al bajar y vuelve al subir;
  // el logo y el carrito quedan siempre a la vista.
  const categories = useHideOnScroll();

  return (
    <>
      {/* En mobile la marquesina scrollea con la página y el header pega en
          top-0; en desktop la marquesina es fija y el header va debajo (top-9).
          El borde de abajo solo se ve cuando la fila de categorías está
          escondida: si no, la línea la pone la fila. Siempre está (transparente)
          para que la altura no cambie y el scroll no salte. */}
      <header
        className={cn(
          "sticky top-0 z-40 border-b bg-cream px-5 py-3 transition-colors sm:px-8 md:top-9 md:border-ink/10 md:py-4 lg:px-12",
          categories.hidden ? "border-ink/10" : "border-transparent",
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" aria-label="DZ Estudio — inicio" className="shrink-0">
            <img
              src="/logo-extendido.svg"
              alt="DZ Estudio"
              width={713}
              height={176}
              className="h-6 w-auto sm:h-7"
            />
          </Link>

          <div className="flex items-center gap-4 sm:gap-6">
            {/* Desktop: las categorías van al lado del logo */}
            <nav aria-label="Navegación principal" className="hidden md:block">
              <div className="flex items-center gap-6">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="font-mono text-xs font-medium uppercase tracking-widest transition-colors hover:text-pink-ink"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>

            <button
              type="button"
              onClick={openCart}
              aria-label={`Abrir carrito, ${count} ${count === 1 ? "producto" : "productos"}`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-ink/5"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 7h12l1.5 13.5a1 1 0 0 1-1 1.5h-13a1 1 0 0 1-1-1.5L6 7Z" />
                <path d="M9 10V6a3 3 0 0 1 6 0v4" />
              </svg>
              {count > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 font-mono text-[10px] font-medium text-cream"
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile: las categorías en una segunda fila, así entran completas.
          Es un sticky aparte (top-16 = la altura del header, con 1px de
          solape) que al scrollear hacia abajo se desliza detrás del header
          con transform —la altura del documento no cambia, así el scroll no
          salta ni entra en bucle— y vuelve al subir o cuando un link recibe
          foco, así con teclado siempre se llega. */}
      <nav
        aria-label="Categorías"
        onFocus={categories.show}
        className={cn(
          "sticky top-16 z-30 flex gap-2 overflow-x-auto border-b border-ink/10 bg-cream px-5 pb-3 transition-transform sm:px-8 duration-200 ease-out motion-reduce:transition-none md:hidden",
          categories.hidden && "-translate-y-full",
        )}
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className="shrink-0 rounded-full border border-ink/25 px-3.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-widest transition-colors hover:border-ink"
          >
            {link.short ?? link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
