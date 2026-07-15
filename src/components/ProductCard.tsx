import { Link } from "react-router-dom";
import { COLLECTIONS } from "../data/products";
import { formatPrice } from "../lib/format";
import type { Product } from "../types/product";
import Card from "./Card";
import ProductImage from "./ProductImage";
import Tag from "./Tag";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const collection = COLLECTIONS[product.collection];
  const [primary, secondary] = product.images;

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
        </div>
      </Card>

      <div className="flex flex-col gap-1.5 pt-4">
        <Tag color={collection.tagColor} className="self-start">
          {collection.label}
        </Tag>
        <h3 className="text-base font-bold leading-snug">{product.name}</h3>
        <p className="font-mono text-sm uppercase tracking-wider text-ink/70">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}
