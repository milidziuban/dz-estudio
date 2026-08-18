import { CATEGORY_INTRO, CATEGORY_LABEL } from "../data/products";
import type { Category } from "../types/product";
import CollectionCard from "./CollectionCard";

const TAG_COLOR = {
  almohadones: "pink",
  individuales: "celeste",
} as const;

const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

export default function Collections() {
  return (
    <section className="px-5 py-16 sm:px-8 md:py-24 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 font-mono text-xs font-medium uppercase tracking-widest">
          ✧ Las dos líneas
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
                colorB={intro.colorB}
                tagColor={TAG_COLOR[category]}
                tagLabel={intro.tagLabel}
                to={`/tienda?categoria=${category}`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
