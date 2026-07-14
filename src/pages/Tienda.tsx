import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Filters, {
  DEFAULT_FILTERS,
  PRICE_RANGES,
  type FiltersState,
} from "../components/Filters";
import ProductCard from "../components/ProductCard";
import Seo from "../components/Seo";
import { COLLECTIONS } from "../data/products";
import { useProducts } from "../hooks/useProducts";

type SortId = "novedades" | "precio-asc" | "precio-desc" | "vendidos";

const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: "novedades", label: "Novedades" },
  { id: "precio-asc", label: "Precio: menor a mayor" },
  { id: "precio-desc", label: "Precio: mayor a menor" },
  { id: "vendidos", label: "Más vendidos" },
];

export default function Tienda() {
  const { data: products = [], isLoading, isError, refetch } = useProducts();
  const [searchParams] = useSearchParams();
  const coleccionParam = searchParams.get("coleccion");

  const [filters, setFilters] = useState<FiltersState>({
    ...DEFAULT_FILTERS,
    coleccion:
      coleccionParam && coleccionParam in COLLECTIONS ? coleccionParam : "all",
  });
  const [sort, setSort] = useState<SortId>("novedades");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const updateFilters = (patch: Partial<FiltersState>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  const visible = useMemo(() => {
    const range = PRICE_RANGES.find((r) => r.id === filters.precio)!;

    const filtered = products.filter(
      (p) =>
        (filters.categoria === "all" || p.category === filters.categoria) &&
        (filters.coleccion === "all" || p.collection === filters.coleccion) &&
        (filters.color === "all" ||
          p.colors.includes(filters.color as (typeof p.colors)[number])) &&
        p.price >= range.min &&
        p.price < range.max,
    );

    const sorted = [...filtered];
    switch (sort) {
      case "novedades":
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case "precio-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "precio-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "vendidos":
        sorted.sort((a, b) => b.sales - a.sales);
        break;
    }
    return sorted;
  }, [filters, sort, products]);

  return (
    <div className="px-5 py-12 sm:px-8 md:py-16 lg:px-12">
      <Seo
        title="Tienda"
        description="Manteles, individuales, servilletas, almohadones y mantas en edición limitada. Elegí tu dupla de color."
        path="/tienda"
      />
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 font-mono text-xs font-medium uppercase tracking-widest">
          ✦ Tienda
        </p>
        <h1 className="mb-10 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Todo lo que{" "}
          <em className="font-serif font-normal italic text-petroleo">
            todavía
          </em>{" "}
          queda
        </h1>

        <div className="md:grid md:grid-cols-[260px_1fr] md:gap-10 lg:gap-14">
          {/* Sidebar desktop */}
          <aside className="hidden md:block" aria-label="Filtros">
            <Filters value={filters} onChange={updateFilters} />
          </aside>

          <div>
            {/* Barra superior: filtrar (mobile) + orden + contador */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="rounded-full border-2 border-ink bg-cream px-5 py-2 font-mono text-xs font-medium uppercase tracking-widest shadow-hard transition-all hover:-translate-y-0.5 md:hidden"
              >
                Filtrar ✦
              </button>

              <p className="font-mono text-xs uppercase tracking-widest">
                {visible.length}{" "}
                {visible.length === 1 ? "producto" : "productos"}
              </p>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="sort"
                  className="font-mono text-xs font-medium uppercase tracking-widest"
                >
                  Ordenar:
                </label>
                <select
                  id="sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortId)}
                  className="rounded-lg border-2 border-ink bg-cream px-3 py-2 font-mono text-xs uppercase tracking-wider"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
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
              <div className="rounded-[14px] border-[2.5px] border-ink bg-orange p-10 text-center text-cream shadow-hard-lg">
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
                  className="mt-6 rounded-full border-2 border-ink bg-cream px-6 py-2 font-mono text-xs font-medium uppercase tracking-widest text-ink shadow-hard"
                >
                  Reintentar ✦
                </button>
              </div>
            ) : visible.length > 0 ? (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {visible.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-[14px] border-[2.5px] border-ink bg-lila p-10 text-center shadow-hard-lg">
                <p className="font-serif text-2xl italic">
                  Nada por acá ✧
                </p>
                <p className="mt-2 text-sm">
                  Probá con menos filtros. O con menos exigencias.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer de filtros mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Cerrar filtros"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-ink/50"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filtros"
            className="absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto border-r-[2.5px] border-ink bg-cream p-6"
          >
            <div className="mb-8 flex items-center justify-between">
              <p className="font-mono text-sm font-medium uppercase tracking-widest">
                ✦ Filtros
              </p>
              <button
                type="button"
                aria-label="Cerrar filtros"
                onClick={() => setDrawerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-cream text-lg shadow-hard"
              >
                ✕
              </button>
            </div>
            <Filters value={filters} onChange={updateFilters} />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="mt-10 w-full rounded-full border-[2.5px] border-ink bg-ink px-7 py-3 font-sans text-sm font-bold uppercase tracking-wide text-cream shadow-hard"
            >
              Ver {visible.length}{" "}
              {visible.length === 1 ? "producto" : "productos"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
