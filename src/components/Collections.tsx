import { CATEGORY_INTRO, CATEGORY_LABEL } from "../data/products";
import { useProducts } from "../hooks/useProducts";
import { formatPrice } from "../lib/format";
import type { Category, Product } from "../types/product";
import CollectionCard from "./CollectionCard";

const TAG_COLOR = {
  almohadones: "pink",
  individuales: "celeste",
} as const;

const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

/** " · $32.600" si todos cuestan lo mismo, " · desde $9.700" si no. */
function precioDeCategoria(products: Product[], category: Category): string {
  const precios = products
    .filter((p) => p.category === category)
    .map((p) => p.price);
  if (!precios.length) return "";
  const min = Math.min(...precios);
  const max = Math.max(...precios);
  return min === max
    ? ` · ${formatPrice(min)}`
    : ` · desde ${formatPrice(min)}`;
}

export default function Collections() {
  const { data: products = [] } = useProducts();

  return (
    <section className="px-5 py-16 sm:px-8 md:py-24 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 font-mono text-xs font-medium uppercase tracking-widest">
          ✧ Dos lanzamientos
        </p>
        <h2 className="mb-10 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Categorías
        </h2>

        <div className="grid gap-8 md:grid-cols-2 md:gap-6 lg:gap-8">
          {CATEGORIES.map((category) => {
            const intro = CATEGORY_INTRO[category];
            return (
              <CollectionCard
                key={category}
                title={CATEGORY_LABEL[category]}
                description={intro.description}
                image={intro.image}
                imageAlt={intro.imageAlt}
                imageFit={intro.imageFit}
                imageWidth={intro.imageWidth}
                imageHeight={intro.imageHeight}
                colorB={intro.colorB}
                tagColor={TAG_COLOR[category]}
                tagLabel={`${intro.tagLabel}${precioDeCategoria(products, category)}`}
                to={`/tienda?categoria=${category}`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
