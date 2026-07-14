import { Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { cartCount } from "../lib/cart";

export default function Header() {
  const items = useCart((s) => s.items);
  const openCart = useCart((s) => s.open);
  const count = cartCount(items);

  return (
    <header className="sticky top-9 z-40 border-b-[2.5px] border-ink bg-cream px-5 py-4 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link to="/" className="text-xl font-extrabold">
          DZ{" "}
          <em className="font-serif font-normal italic text-pink">Estudio</em>
        </Link>

        <div className="flex items-center gap-6">
          <nav aria-label="Navegación principal">
            <Link
              to="/tienda"
              className="font-mono text-xs font-medium uppercase tracking-widest underline decoration-2 underline-offset-4 hover:decoration-pink"
            >
              Tienda ✦
            </Link>
          </nav>

          <button
            type="button"
            onClick={openCart}
            aria-label={`Abrir carrito, ${count} ${count === 1 ? "producto" : "productos"}`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-cream shadow-hard transition-transform hover:-translate-y-0.5"
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
                className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-ink bg-pink px-1 font-mono text-[10px] font-medium"
              >
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
