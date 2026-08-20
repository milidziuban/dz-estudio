import { Link } from "react-router-dom";
import { formatPrice } from "../lib/format";
import { COMBO_CATEGORIES, COMBO_PROMO } from "../lib/promos";
import type { Product } from "../types/product";
import Card from "./Card";
import ProductImage from "./ProductImage";
import Tag from "./Tag";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const [primary, secondary] = product.images;
  const soldOut =
    !product.inStock ||
    (product.variants?.length
      ? product.variants.every((v) => v.inStock === false)
      : false);

  return (
    <Link
      to={`/producto/${product.slug}`}
      className="group block rounded-2xl"
      aria-label={`${product.name} — ${formatPrice(product.price)}`}
    >
      <Card>
        <div className="relative aspect-square overflow-hidden">
          <ProductImage
            image={primary}
            alt={product.name}
            className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {secondary && (
            <ProductImage
              image={secondary}
              alt=""
              className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          )}
          {COMBO_CATEGORIES.includes(product.category) && (
            <Tag color="amarillo" className="absolute left-3 top-3 text-[10px]">
              {COMBO_PROMO.short}
            </Tag>
          )}
          {soldOut && (
            <span className="absolute inset-0 flex items-center justify-center bg-cream/80 font-mono text-xs font-medium uppercase tracking-widest">
              Sin stock
            </span>
          )}
        </div>
      </Card>

      <div className="flex flex-col gap-1.5 pt-4">
        <h3 className="text-base font-bold leading-snug">{product.name}</h3>
        <p className="font-mono text-sm uppercase tracking-wider text-ink/70">
          {formatPrice(product.price)}
        </p>
        {product.variants && (
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/50">
            {product.variants.map((v) => v.label).join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}
