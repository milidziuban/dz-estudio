import Button from "./Button";
import Tag from "./Tag";

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:px-8 md:pb-28 md:pt-24 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <Tag color="amarillo" className="mb-6">
          ✦ Nueva colección — invierno 2026
        </Tag>

        <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          Textiles con{" "}
          <em className="font-serif font-normal italic text-pink">carácter</em>{" "}
          para casas con{" "}
          <span className="underline decoration-amarillo decoration-[6px] underline-offset-4 md:decoration-8 md:underline-offset-8">
            opinión
          </span>
          .
        </h1>

        <p className="mt-8 max-w-xl text-lg leading-relaxed md:text-xl">
          Manteles, individuales, almohadones y mantas en ediciones limitadas.
          La mesa dice más de vos que tu Instagram.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button to="/tienda">Ver la tienda</Button>
          <Button variant="secondary">Nuestra historia</Button>
        </div>
      </div>

      <p
        className="pointer-events-none absolute -right-6 top-10 hidden rotate-12 font-serif text-2xl italic text-petroleo lg:block"
        aria-hidden="true"
      >
        ✿ hecho en Argentina
      </p>
    </section>
  );
}
