import { Link } from "react-router-dom";
import { COLLECTIONS } from "../data/products";
import { formatPrice } from "../lib/format";
import type { Product } from "../types/product";
import Card from "./Card";
import ProductImage from "./ProductImage";
import ScallopBorder from "./ScallopBorder";
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
      className="group block rounded-[14px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-pink"
      aria-label={`${product.name} — ${formatPrice(product.price)}`}
    >
      <Card className="transition-transform duration-150 group-hover:-translate-y-1">
        <div className="relative aspect-square">
          <ProductImage
            image={primary}
            alt={product.name}
            className="absolute inset-0"
          />
          {secondary && (
            <ProductImage
              image={secondary}
              alt=""
              className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            />
          )}
          <div className="absolute inset-x-0 top-0">
            <ScallopBorder color="#F3EFE4" direction="down" height={10} />
          </div>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-ink bg-cream px-5 py-2 font-mono text-xs font-medium uppercase tracking-widest opacity-0 shadow-hard transition-opacity duration-200 group-hover:opacity-100">
            Ver más ✦
          </span>
        </div>

        <div className="flex flex-col gap-2 p-5">
          <Tag color={collection.tagColor} className="self-start">
            {collection.label}
          </Tag>
          <h3 className="text-lg font-bold leading-snug">{product.name}</h3>
          <p className="font-mono text-sm font-medium uppercase tracking-wider">
            {formatPrice(product.price)}
          </p>
        </div>
      </Card>
    </Link>
  );
}
