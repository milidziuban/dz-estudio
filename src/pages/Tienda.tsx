import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Seo from "../components/Seo";
import { CATEGORY_LABEL } from "../data/products";
import { useProducts } from "../hooks/useProducts";
import { cn } from "../lib/cn";
import { productListJsonLd } from "../lib/structured-data";
import type { Category } from "../types/product";

type CategoriaActiva = Category | "all";

const CATEGORIAS = Object.keys(CATEGORY_LABEL) as Category[];

/** Cualquier valor que no sea una categoría real (o ninguno) muestra todo. */
const categoriaFromParam = (param: string | null): CategoriaActiva =>
  CATEGORIAS.find((c) => c === param) ?? "all";

/** Las mismas tres entradas que la navbar. La categoría vive en la URL
 *  (`?categoria=`) y no en un estado local: un link compartido abre la tienda
 *  ya filtrada y el botón "atrás" deshace el filtro. */
const CATEGORY_LINKS: { id: CategoriaActiva; label: string; to: string }[] = [
  { id: "all", label: "Todo", to: "/tienda" },
  ...CATEGORIAS.map((id) => ({
    id,
    label: CATEGORY_LABEL[id],
    to: `/tienda?categoria=${id}`,
  })),
];

type SortId = "novedades" | "precio-asc" | "precio-desc";

const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: "novedades", label: "Novedades" },
  { id: "precio-asc", label: "Precio: menor a mayor" },
  { id: "precio-desc", label: "Precio: mayor a menor" },
];

export default function Tienda() {
  const { data: products = [], isLoading, isError, refetch } = useProducts();
  const [searchParams] = useSearchParams();
  const categoria = categoriaFromParam(searchParams.get("categoria"));
  const [sort, setSort] = useState<SortId>("novedades");

  const visible = useMemo(() => {
    const filtered =
      categoria === "all"
        ? products
        : products.filter((p) => p.category === categoria);

    const sorted = [...filtered];
    switch (sort) {
      case "novedades":
        // El id de Tienda Nube crece con el alta: mayor id = más nuevo
        sorted.sort((a, b) => b.id - a.id);
        break;
      case "precio-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "precio-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
    }
    return sorted;
  }, [categoria, sort, products]);

  return (
    <div className="px-5 py-12 sm:px-8 md:py-16 lg:px-12">
      <Seo
        title="Tienda"
        description="Almohadones e individuales estampados, hechos en Argentina. Elegí tu dupla de color."
        path="/tienda"
        jsonLd={visible.length ? productListJsonLd(visible) : undefined}
      />
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 font-mono text-xs font-medium uppercase tracking-widest">
          ✦ Tienda
        </p>
        <h1 className="mb-10 text-4xl font-bold tracking-tight sm:text-5xl">
          <em className="font-serif font-normal italic text-petroleo">
            Tienda
          </em>
        </h1>

        {/* Barra superior: categoría + contador + orden */}
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-6">
          <nav
            aria-label="Filtrar por categoría"
            className="flex flex-wrap gap-2"
          >
            {CATEGORY_LINKS.map((link) => {
              const selected = categoria === link.id;
              return (
                <Link
                  key={link.id}
                  to={link.to}
                  aria-current={selected ? "page" : undefined}
                  className={cn(
                    "rounded-full border px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-widest transition-colors",
                    selected
                      ? "border-ink bg-ink text-cream"
                      : "border-ink/25 bg-transparent text-ink hover:border-ink",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-4 md:justify-end md:gap-6">
            <p className="font-mono text-xs uppercase tracking-widest">
              {visible.length}{" "}
              {visible.length === 1 ? "producto" : "productos"}
            </p>

            <div className="flex items-center gap-2">
              {/* En mobile el select ya dice "Novedades": la etiqueta queda
                  solo para lectores de pantalla y la fila entra en 375px */}
              <label
                htmlFor="sort"
                className="sr-only font-mono text-xs font-medium uppercase tracking-widest md:not-sr-only"
              >
                Ordenar:
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortId)}
                className="rounded-lg border border-ink/25 bg-transparent px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors focus:border-ink focus:outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <p
            className="animate-pulse py-20 text-center font-mono text-sm uppercase tracking-widest"
            role="status"
          >
            ✦ Cargando la tienda…
          </p>
        ) : isError ? (
          <div className="rounded-2xl bg-orange p-10 text-center text-cream">
            <p className="font-serif text-2xl italic">
              Se nos corrió un punto ✧
            </p>
            <p className="mt-2 text-sm">
              No pudimos cargar los productos. Revisá tu conexión (o que la
              base de datos exista).
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-6 rounded-full bg-cream px-6 py-2.5 font-mono text-xs font-medium uppercase tracking-widest text-ink transition-colors hover:bg-white"
            >
              Reintentar ✦
            </button>
          </div>
        ) : visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-lila p-10 text-center">
            <p className="font-serif text-2xl italic">Nada por acá ✧</p>
            <p className="mt-2 text-sm">
              {categoria === "all"
                ? "No hay nada publicado por ahora. Volvé en unos días."
                : `Todavía no hay ${CATEGORY_LABEL[categoria].toLowerCase()} publicados. El resto de la tienda, sí.`}
            </p>
            {categoria !== "all" && (
              <Link
                to="/tienda"
                className="mt-6 inline-block rounded-full bg-ink px-6 py-2.5 font-mono text-xs font-medium uppercase tracking-widest text-cream transition-colors hover:bg-ink/80"
              >
                Ver todo ✦
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
