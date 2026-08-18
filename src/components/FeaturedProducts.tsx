import Button from "./Button";
import ProductCard from "./ProductCard";
import { useProducts } from "../hooks/useProducts";

/** Catálogo completo en la home: con cinco productos no tiene sentido
 *  esconderlos detrás de un click. */
export default function FeaturedProducts() {
  const { data: products = [], isLoading } = useProducts();

  return (
    <section
      id="productos"
      className="scroll-mt-24 px-5 pb-16 sm:px-8 md:pb-24 lg:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 font-mono text-xs font-medium uppercase tracking-widest">
              ✦ Todo el catálogo
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Nuestros{" "}
              <em className="font-serif font-normal italic text-pink">
                productos
              </em>
            </h2>
          </div>
          <Button variant="secondary" to="/tienda">
            Ver con filtros
          </Button>
        </div>

        {isLoading ? (
          <p
            className="animate-pulse py-20 text-center font-mono text-sm uppercase tracking-widest"
            role="status"
          >
            ✦ Cargando el catálogo…
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-3 lg:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
