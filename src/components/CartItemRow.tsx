import { Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import type { ResolvedCartItem } from "../lib/cart";
import { formatPrice } from "../lib/format";
import { avisoDeUnidades, unidadesDisponibles } from "../lib/stock";
import ProductImage from "./ProductImage";

type CartItemRowProps = {
  item: ResolvedCartItem;
};

export default function CartItemRow({ item }: CartItemRowProps) {
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const close = useCart((s) => s.close);
  const { key, product, variant, qty, max } = item;
  const label = variant ? `${product.name} — ${variant.label}` : product.name;

  // `qty` ya viene topeada al stock (resolveCartItems). Acá solo se frena el
  // botón de sumar y se dice por qué, que es lo que la clienta ve.
  const aviso = qty >= max ? avisoDeUnidades(unidadesDisponibles(product, variant)) : null;

  return (
    <li className="flex gap-4 border-b border-ink/10 py-4">
      <Link
        to={`/producto/${product.slug}`}
        onClick={close}
        className="shrink-0"
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductImage
          image={product.images[0]}
          alt=""
          className="aspect-square w-20 rounded-lg"
        />
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/producto/${product.slug}`}
            onClick={close}
            className="text-sm font-bold leading-snug hover:underline"
          >
            {product.name}
          </Link>
          <button
            type="button"
            aria-label={`Eliminar ${label} del carrito`}
            onClick={() => remove(key)}
            className="text-lg leading-none hover:text-orange-ink"
          >
            ✕
          </button>
        </div>

        {variant && (
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-widest text-ink/65">
            {variant.label}
          </p>
        )}

        <p className="mt-1 font-mono text-xs tracking-wider text-ink/70">
          {formatPrice(product.price)} c/u
        </p>

        {aviso && (
          <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-petroleo">
            {aviso}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center rounded-full border border-ink/25">
            <button
              type="button"
              aria-label={`Restar una unidad de ${label}`}
              onClick={() => setQty(key, qty - 1, max)}
              className="px-3 py-1 font-bold hover:text-pink-ink"
            >
              −
            </button>
            <span className="min-w-7 text-center font-mono text-xs font-medium">
              {qty}
            </span>
            <button
              type="button"
              aria-label={`Sumar una unidad de ${label}`}
              disabled={qty >= max}
              onClick={() => setQty(key, qty + 1, max)}
              className="px-3 py-1 font-bold hover:text-pink-ink disabled:cursor-not-allowed disabled:text-ink/30 disabled:hover:text-ink/30"
            >
              +
            </button>
          </div>
          <p className="font-mono text-sm font-medium tracking-wider">
            {formatPrice(product.price * qty)}
          </p>
        </div>
      </div>
    </li>
  );
}
