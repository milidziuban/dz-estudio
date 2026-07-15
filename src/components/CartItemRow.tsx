import { Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import type { ResolvedCartItem } from "../lib/cart";
import { formatPrice } from "../lib/format";
import ProductImage from "./ProductImage";

type CartItemRowProps = {
  item: ResolvedCartItem;
};

export default function CartItemRow({ item }: CartItemRowProps) {
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const close = useCart((s) => s.close);
  const { product, qty } = item;

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
            aria-label={`Eliminar ${product.name} del carrito`}
            onClick={() => remove(product.slug)}
            className="text-lg leading-none hover:text-orange"
          >
            ✕
          </button>
        </div>

        <p className="mt-1 font-mono text-xs tracking-wider text-ink/70">
          {formatPrice(product.price)} c/u
        </p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center rounded-full border border-ink/25">
            <button
              type="button"
              aria-label={`Restar una unidad de ${product.name}`}
              onClick={() => setQty(product.slug, qty - 1)}
              className="px-3 py-1 font-bold hover:text-pink"
            >
              −
            </button>
            <span className="min-w-7 text-center font-mono text-xs font-medium">
              {qty}
            </span>
            <button
              type="button"
              aria-label={`Sumar una unidad de ${product.name}`}
              onClick={() => setQty(product.slug, qty + 1)}
              className="px-3 py-1 font-bold hover:text-pink"
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
