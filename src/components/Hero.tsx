import { INSTALLMENTS } from "../lib/promos";
import Button from "./Button";
import Tag from "./Tag";

export default function Hero() {
  return (
    <section className="px-5 pb-12 pt-10 sm:px-8 md:pb-16 md:pt-14 lg:px-12">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-14">
        <div>
          <Tag color="amarillo" className="mb-6">
            ✦ {INSTALLMENTS.label}
          </Tag>

          <h1 className="text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Animate a ponerle{" "}
            <em className="font-serif font-normal italic text-pink">onda</em>{" "}
            a tu hogar.
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed">
            Encontrá distintos almohadones e individuales impermeables estampados.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button to="/tienda">Ver los productos</Button>
            <Button variant="secondary" to="/tienda?categoria=almohadones">
              Almohadones desde $18.300
            </Button>
          </div>

          <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-ink/60">
            Envíos a todo el país ✦ Retiro gratis en Santa Fe Capital
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
            fetchPriority="high"
            className="w-full max-w-md md:max-w-none"
          />
        </div>
      </div>
    </section>
  );
}
