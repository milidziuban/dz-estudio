import { useEnvioNacional } from "../hooks/useEnvioNacional";
import { useInstallments } from "../hooks/useInstallments";
import { useProducts } from "../hooks/useProducts";
import { envioTitular } from "../lib/envio-texto";
import { formatPrice } from "../lib/format";
import Button from "./Button";
import Tag from "./Tag";

export default function Hero() {
  const cuotas = useInstallments();
  const envio = useEnvioNacional();
  const { data: products } = useProducts();

  // El precio sale de la base: escrito a mano quedó viejo con cada aumento.
  const preciosAlmohadones = (products ?? [])
    .filter((p) => p.category === "almohadones")
    .map((p) => p.price);
  const almohadonesDesde = preciosAlmohadones.length
    ? Math.min(...preciosAlmohadones)
    : null;

  return (
    <section className="px-5 pb-12 pt-10 sm:px-8 md:pb-16 md:pt-14 lg:px-12">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-14">
        <div>
          <Tag color="amarillo" className="mb-6">
            ✦ {cuotas.label}
          </Tag>

          <h1 className="text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Animate a ponerle{" "}
            <em className="font-serif font-normal italic text-pink-ink">onda</em>{" "}
            a tu hogar.
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed">
            Encontrá almohadones estampados en pana e individuales
            impermeables.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button to="/tienda">Ver los productos</Button>
            <Button variant="secondary" to="/tienda?categoria=almohadones">
              {almohadonesDesde === null
                ? "Ver almohadones"
                : `Almohadones desde ${formatPrice(almohadonesDesde)}`}
            </Button>
          </div>

          <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-ink/65">
            {envioTitular(envio)} ✦ Retiro gratis en Santa Fe Capital
          </p>
        </div>

        {/* Lo primero que se ve es lo que se vende */}
        <div className="flex items-center justify-center">
          {/* Sin `width`/`height` esta foto ocupa 0 px hasta que carga y
              empuja media home hacia abajo: en un contenedor de 400 px el salto
              medido es de 302 px. Es además el LCP de la home, así que va con
              prioridad alta y sin `lazy`. */}
          <img
            src="/productos/hero-almohadones-trio.webp"
            alt="Tres almohadones DZ Estudio: rombos bordó y rosa, rombos celeste y marrón, y rayas blanco y negro"
            width={1400}
            height={1057}
            fetchpriority="high"
            className="w-full max-w-md md:max-w-none"
          />
        </div>
      </div>
    </section>
  );
}
