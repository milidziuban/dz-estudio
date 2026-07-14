import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../components/Button";
import EditionBadge from "../components/EditionBadge";
import ProductCard from "../components/ProductCard";
import ProductImage from "../components/ProductImage";
import ScallopBorder from "../components/ScallopBorder";
import Seo from "../components/Seo";
import Tag from "../components/Tag";
import { CATEGORY_LABEL, COLLECTIONS } from "../data/products";
import { useCart } from "../hooks/useCart";
import { useProducts } from "../hooks/useProducts";
import { cn } from "../lib/cn";
import { formatPrice } from "../lib/format";

const DETAILS = [
  { key: "medidas", label: "Medidas" },
  { key: "material", label: "Material" },
  { key: "cuidados", label: "Cuidados" },
] as const;

export default function Producto() {
  const { slug } = useParams<{ slug: string }>();
  const { data: products = [], isLoading } = useProducts();

  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const addToCart = useCart((s) => s.add);
  const openCart = useCart((s) => s.open);

  const product = products.find((p) => p.slug === slug);

  if (isLoading) {
    return (
      <p
        className="animate-pulse px-5 py-24 text-center font-mono text-sm uppercase tracking-widest"
        role="status"
      >
        ✦ Cargando…
      </p>
    );
  }

  if (!product) {
    return (
      <div className="px-5 py-24 text-center">
        <p className="font-serif text-3xl italic">
          Este producto ya no está ✧
        </p>
        <p className="mt-3">Edición limitada: cuando se van, se van.</p>
        <Link
          to="/tienda"
          className="mt-8 inline-block font-mono text-xs font-medium uppercase tracking-widest underline decoration-2 underline-offset-4"
        >
          ← Volver a la tienda
        </Link>
      </div>
    );
  }

  const collection = COLLECTIONS[product.collection];
  const related = [...products]
    .filter((p) => p.slug !== product.slug)
    .sort((a, b) => {
      const score = (p: (typeof products)[number]) =>
        (p.collection === product.collection ? 2 : 0) +
        (p.category === product.category ? 1 : 0);
      return score(b) - score(a);
    })
    .slice(0, 3);

  const handleAdd = () => {
    addToCart(product.slug, qty);
    openCart();
  };

  return (
    <div className="px-5 py-12 sm:px-8 md:py-16 lg:px-12">
      <Seo
        title={product.name}
        description={product.description}
        image={`https://picsum.photos/seed/${product.images[0].seed}/1200/630`}
        path={`/producto/${product.slug}`}
      />
      <div className="mx-auto max-w-6xl">
        <Link
          to="/tienda"
          className="font-mono text-xs font-medium uppercase tracking-widest underline decoration-2 underline-offset-4 hover:decoration-pink"
        >
          ← Volver a la tienda
        </Link>

        <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-14">
          {/* Galería */}
          <div>
            <div className="relative overflow-hidden rounded-[14px] border-[2.5px] border-ink shadow-hard-lg">
              <ProductImage
                image={product.images[imgIdx]}
                alt={`${product.name} — vista ${imgIdx + 1}`}
                className="aspect-square"
              />
              <div className="absolute inset-x-0 top-0">
                <ScallopBorder color="#F3EFE4" direction="down" height={12} />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              {product.images.map((image, i) => (
                <button
                  key={image.seed}
                  type="button"
                  aria-label={`Ver foto ${i + 1}`}
                  aria-pressed={imgIdx === i}
                  onClick={() => setImgIdx(i)}
                  className={cn(
                    "w-20 overflow-hidden rounded-lg border-2 border-ink transition-all",
                    imgIdx === i
                      ? "shadow-hard"
                      : "opacity-60 hover:opacity-100",
                  )}
                >
                  <ProductImage
                    image={image}
                    alt=""
                    className="aspect-square"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="flex flex-wrap gap-2">
              <Tag>{CATEGORY_LABEL[product.category]}</Tag>
              <Tag color={collection.tagColor}>
                Colección {collection.label}
              </Tag>
            </div>

            <div className="mt-5 flex items-start justify-between gap-4">
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                {product.name}
              </h1>
              <EditionBadge
                number={product.edition.number}
                total={product.edition.total}
                className="shrink-0"
              />
            </div>

            <p className="mt-4 font-mono text-2xl font-medium tracking-wider">
              {formatPrice(product.price)}
            </p>

            <p className="mt-6 leading-relaxed">{product.description}</p>

            {/* Cantidad + carrito */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex w-fit items-center rounded-full border-[2.5px] border-ink bg-cream shadow-hard">
                <button
                  type="button"
                  aria-label="Restar una unidad"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-4 py-3 text-lg font-bold hover:text-pink"
                >
                  −
                </button>
                <span
                  className="min-w-10 text-center font-mono text-sm font-medium"
                  aria-live="polite"
                >
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label="Sumar una unidad"
                  onClick={() => setQty((q) => q + 1)}
                  className="px-4 py-3 text-lg font-bold hover:text-pink"
                >
                  +
                </button>
              </div>
              <Button onClick={handleAdd} className="flex-1 py-4 text-base">
                Agregar al carrito ✦
              </Button>
            </div>
            {/* Detalles */}
            <dl className="mt-10 border-t-2 border-ink">
              {DETAILS.map(({ key, label }) => (
                <div key={key} className="border-b-2 border-ink py-4">
                  <dt className="font-mono text-xs font-medium uppercase tracking-widest">
                    ✧ {label}
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed">
                    {product[key]}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Relacionados */}
        <section className="mt-20">
          <h2 className="mb-8 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Va perfecto{" "}
            <em className="font-serif font-normal italic text-pink">con</em>
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
