import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../components/Button";
import ProductCard from "../components/ProductCard";
import ProductImage from "../components/ProductImage";
import Seo from "../components/Seo";
import Tag from "../components/Tag";
import { CATEGORY_LABEL } from "../data/products";
import { useCart } from "../hooks/useCart";
import { useProducts } from "../hooks/useProducts";
import { useStoreSettings } from "../hooks/useStoreSettings";
import { trackAddToCart, trackViewItem } from "../lib/analytics";
import { cn } from "../lib/cn";
import { COLOR_HEX } from "../lib/colors";
import { formatPrice } from "../lib/format";
import { comboBanner, DEFAULT_PROMOS, INSTALLMENTS } from "../lib/promos";
import { SITE } from "../lib/site";
import {
  productBreadcrumbJsonLd,
  productJsonLd,
} from "../lib/structured-data";

const DETAILS = [
  { key: "medidas", label: "Medidas" },
  { key: "peso", label: "Peso" },
  { key: "material", label: "Material" },
  { key: "cuidados", label: "Cuidados" },
] as const;

export default function Producto() {
  const { slug } = useParams<{ slug: string }>();
  const { data: products = [], isLoading } = useProducts();
  // Porcentaje y mínimo del combo salen del panel, no del código
  const { data: settings } = useStoreSettings();
  const promos = settings?.marketing.promos ?? DEFAULT_PROMOS;

  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [variantId, setVariantId] = useState<string | undefined>();
  const addToCart = useCart((s) => s.add);
  const openCart = useCart((s) => s.open);

  const product = products.find((p) => p.slug === slug);

  // Al cambiar de producto, arrancamos con la primera variante que tenga
  // stock — si todas están agotadas, con la primera nomás.
  useEffect(() => {
    const variants = product?.variants;
    setVariantId(
      variants?.find((v) => v.inStock !== false)?.id ?? variants?.[0]?.id,
    );
    setImgIdx(0);
    setQty(1);
  }, [product?.slug, product?.variants]);

  // `view_item` una vez por ficha abierta. Va atado al slug y no a la variante
  // elegida: cambiar de color no es haber mirado otro producto.
  useEffect(() => {
    if (product) trackViewItem(product);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.slug]);

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

  // Primero los de la misma categoría, después el resto
  const related = [...products]
    .filter((p) => p.slug !== product.slug)
    .sort(
      (a, b) =>
        Number(b.category === product.category) -
        Number(a.category === product.category),
    )
    .slice(0, 3);

  const selectedVariant = product.variants?.find((v) => v.id === variantId);
  const variantSoldOut = selectedVariant?.inStock === false;
  const canAdd = product.inStock && !variantSoldOut;
  // null si a esta categoría no le corre el combo
  const avisoCombo = comboBanner(product.category, promos);

  const handleAdd = () => {
    addToCart(product.slug, variantId, qty);
    trackAddToCart(product, selectedVariant, qty);
    openCart();
  };

  return (
    <div className="px-5 py-12 sm:px-8 md:py-16 lg:px-12">
      <Seo
        title={product.name}
        description={product.description}
        image={`${SITE.url}${product.images[0].src}`}
        path={`/producto/${product.slug}`}
        jsonLd={[productJsonLd(product), productBreadcrumbJsonLd(product)]}
      />
      <div className="mx-auto max-w-6xl">
        <Link
          to="/tienda"
          className="font-mono text-xs font-medium uppercase tracking-widest underline decoration-1 underline-offset-4 transition-colors hover:text-pink"
        >
          ← Volver a la tienda
        </Link>

        <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-14">
          {/* Galería */}
          <div>
            <div className="relative overflow-hidden rounded-2xl">
              <ProductImage
                image={product.images[imgIdx]}
                alt={`${product.name} — vista ${imgIdx + 1}`}
                className="aspect-square"
                priority
              />
            </div>
            {product.images.length > 1 && (
              <div className="mt-4 flex gap-3">
                {product.images.map((image, i) => (
                  <button
                    key={image.src}
                    type="button"
                    aria-label={`Ver foto ${i + 1}`}
                    aria-pressed={imgIdx === i}
                    onClick={() => setImgIdx(i)}
                    className={cn(
                      "w-20 overflow-hidden rounded-lg transition-all",
                      imgIdx === i
                        ? "ring-1 ring-ink ring-offset-2 ring-offset-cream"
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
            )}
          </div>

          {/* Info */}
          <div>
            <Tag>{CATEGORY_LABEL[product.category]}</Tag>

            <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              {product.name}
            </h1>

            <p className="mt-4 font-mono text-2xl font-medium tracking-wider">
              {formatPrice(product.price)}
            </p>
            <p className="mt-1.5 font-mono text-xs uppercase tracking-widest text-ink/65">
              {INSTALLMENTS.label} ✦ 10% off por transferencia
            </p>

            {avisoCombo && (
              <p className="mt-5 rounded-xl bg-amarillo px-4 py-3 text-sm leading-relaxed">
                ✦ {avisoCombo}.
              </p>
            )}

            {product.description && (
              <p className="mt-6 leading-relaxed">{product.description}</p>
            )}

            {/* Variantes */}
            {product.variants && (
              <fieldset className="mt-8">
                <legend className="mb-3 font-mono text-xs font-medium uppercase tracking-widest">
                  ✿ Color
                </legend>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const soldOut = variant.inStock === false;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        aria-pressed={variantId === variant.id}
                        disabled={soldOut}
                        onClick={() => setVariantId(variant.id)}
                        title={soldOut ? "Sin stock" : undefined}
                        className={cn(
                          "flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-widest transition-colors",
                          soldOut
                            ? "cursor-not-allowed border-ink/15 text-ink/65"
                            : variantId === variant.id
                              ? "border-ink bg-ink text-cream"
                              : "border-ink/25 hover:border-ink",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "h-3.5 w-3.5 rounded-full border border-ink/20",
                            soldOut && "opacity-40",
                          )}
                          style={{ backgroundColor: COLOR_HEX[variant.color] }}
                        />
                        {variant.label}
                        {soldOut && " · sin stock"}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {/* Cantidad + carrito */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex w-fit items-center rounded-full border border-ink/25">
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
              <Button
                onClick={handleAdd}
                disabled={!canAdd}
                className="flex-1 py-4 text-base disabled:cursor-not-allowed disabled:opacity-50"
              >
                {canAdd ? "Agregar al carrito ✦" : "Sin stock"}
              </Button>
            </div>

            {/* Envío y pago: lo que el cliente pregunta antes de comprar */}
            <ul className="mt-6 space-y-2 text-sm">
              <li className="flex gap-2.5">
                <span aria-hidden="true">✦</span>
                <span>
                  Envíos a todo el país con Andreani, a sucursal o a domicilio.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span aria-hidden="true">✧</span>
                <span>
                  Retiro gratis en {SITE.retiro.direccion}.{" "}
                  {SITE.retiro.horario}.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span aria-hidden="true">✿</span>
                <span>
                  Tarjeta de crédito, débito, efectivo o transferencia. Cambios
                  dentro de 30 días.
                </span>
              </li>
            </ul>

            {/* Detalles */}
            <dl className="mt-10 border-t border-ink/15">
              {DETAILS.filter(({ key }) => product[key]).map(
                ({ key, label }) => (
                  <div key={key} className="border-b border-ink/15 py-4">
                    <dt className="font-mono text-xs font-medium uppercase tracking-widest">
                      ✧ {label}
                    </dt>
                    <dd className="mt-1.5 text-sm leading-relaxed">
                      {product[key]}
                    </dd>
                  </div>
                ),
              )}
            </dl>
          </div>
        </div>

        {/* Relacionados */}
        <section className="mt-20">
          <h2 className="mb-8 text-3xl font-bold tracking-tight sm:text-4xl">
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
