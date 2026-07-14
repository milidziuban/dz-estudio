import Button from "./Button";

export default function About() {
  return (
    <section className="px-5 py-16 sm:px-8 md:py-24 lg:px-12">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16">
        <div
          className="h-64 rounded-[14px] border-[2.5px] border-ink shadow-hard-lg md:h-80"
          style={{
            backgroundImage:
              "repeating-conic-gradient(#2F5D62 0% 25%, #F3EFE4 0% 50%)",
            backgroundSize: "48px 48px",
          }}
          role="img"
          aria-label="Patrón damero en petróleo y crema"
        />

        <div>
          <p className="mb-3 font-mono text-xs font-medium uppercase tracking-widest">
            ✦ Sobre la marca
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Maximalismo,{" "}
            <em className="font-serif font-normal italic text-pink">
              pero con criterio
            </em>
          </h2>
          <p className="mt-6 leading-relaxed">
            Creemos que una casa sin color es una casa a medio terminar.
            Diseñamos textiles para quien no le teme al color, ni a la
            lavandería: piezas en ediciones limitadas, pensadas para mesas
            largas, sobremesas más largas y livings donde pasa la vida.
          </p>
          <Button variant="secondary" className="mt-8">
            Conocé la historia
          </Button>
        </div>
      </div>
    </section>
  );
}
