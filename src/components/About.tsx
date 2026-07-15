import Button from "./Button";

export default function About() {
  return (
    <section className="px-5 py-16 sm:px-8 md:py-24 lg:px-12">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16">
        <div
          className="h-64 rounded-2xl md:h-80"
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
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Dos colores.{" "}
            <em className="font-serif font-normal italic text-pink">
              Nunca cinco.
            </em>
          </h2>
          <p className="mt-6 leading-relaxed">
            Esa es la única regla. Cada almohadón, individual o bolso sale de
            acá con una paleta elegida con la misma atención con la que se
            arma una tapa de revista, y en tiradas que no se reponen cuando se
            terminan.
          </p>
          <Button variant="secondary" className="mt-8" to="/sobre-nosotros">
            Conocé el estudio
          </Button>
        </div>
      </div>
    </section>
  );
}
