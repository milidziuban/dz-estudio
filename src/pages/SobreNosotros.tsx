import Seo from "../components/Seo";
import ScallopBorder from "../components/ScallopBorder";

export default function SobreNosotros() {
  return (
    <>
      <Seo
        title="Sobre nosotros"
        description="La historia y la filosofía de DZ Estudio: textiles maximalistas, ediciones limitadas y color sin miedo, hechos en Argentina."
        path="/sobre-nosotros"
      />

      <article>
        {/* Hero editorial */}
        <header className="px-5 pt-14 sm:px-8 md:pt-20 lg:px-12">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-4 font-mono text-xs font-medium uppercase tracking-widest">
              ✦ Sobre nosotros
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
              Una casa sin color es una casa a{" "}
              <em className="font-serif font-normal italic text-pink">
                medio terminar
              </em>
              .
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed">
              Hacemos textiles para gente que entiende que la mesa dice más de
              vos que tu Instagram.
            </p>
          </div>
        </header>

        {/* Foto grande */}
        <div className="px-5 py-12 sm:px-8 md:py-16 lg:px-12">
          <div
            className="mx-auto aspect-[16/9] max-w-5xl overflow-hidden rounded-[14px] border-[2.5px] border-ink shadow-hard-lg"
            style={{ backgroundColor: "#F26D9E" }}
          >
            <img
              src="https://picsum.photos/seed/dz-estudio-taller/1200/675"
              alt="El taller de DZ Estudio"
              loading="lazy"
              className="h-full w-full object-cover opacity-80 mix-blend-multiply grayscale"
            />
          </div>
          <p className="mx-auto mt-3 max-w-5xl text-center font-mono text-[11px] uppercase tracking-widest text-ink/60">
            Nuestro taller en Buenos Aires ✧
          </p>
        </div>

        {/* Secciones de texto */}
        <div className="mx-auto max-w-2xl space-y-14 px-5 pb-8 sm:px-8 lg:px-12">
          <section>
            <h2 className="mb-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Cómo{" "}
              <em className="font-serif font-normal italic text-petroleo">
                empezó
              </em>
            </h2>
            <p className="leading-relaxed">
              Empezamos como casi todo lo bueno: por bronca. Bronca de recorrer
              locales enteros de mantelería y encontrar siempre lo mismo —
              beige, gris, el eterno blanco roto que promete ser elegante y
              termina siendo aburrido. Queríamos poner la mesa y que la mesa
              tuviera algo para decir. Como no existía, lo hicimos nosotros.
            </p>
            <p className="mt-4 leading-relaxed">
              La primera colección fueron seis manteles cosidos en un
              monoambiente de Villa Crespo, fotografiados sobre la única mesa
              que teníamos. Se agotaron en dos semanas. Ahí entendimos que no
              éramos los únicos cansados del beige.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
              En qué{" "}
              <em className="font-serif font-normal italic text-orange">
                creemos
              </em>
            </h2>
            <p className="leading-relaxed">
              Creemos en el maximalismo con criterio: dos colores que se animan,
              nunca cinco que se pelean. En que una servilleta puede ser
              graciosa sin ser un chiste. En que las cosas lindas también se
              usan — nuestros textiles se ven mejor con la comida encima, no
              guardados en un cajón esperando la ocasión que nunca llega.
            </p>
            <p className="mt-4 leading-relaxed">
              Y creemos, sobre todo, en no producir de más. Por eso trabajamos
              en ediciones limitadas: cuando se van, se van. No hay reposición
              eterna ni depósito lleno de saldos. Diseñamos una tirada, la
              hacemos bien, y pasamos a la que sigue.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Cómo lo{" "}
              <em className="font-serif font-normal italic text-verde">
                hacemos
              </em>
            </h2>
            <p className="leading-relaxed">
              Todo se diseña y se confecciona en Argentina, con talleres con los
              que trabajamos hace años y a los que les pagamos lo que
              corresponde. Elegimos algodones, linos y lanas que aguanten años
              de lavados, sobremesas largas y algún vino volcado. Para quien no
              le teme al color, ni a la lavandería.
            </p>
          </section>

          <blockquote className="border-l-4 border-pink pl-6">
            <p className="font-serif text-2xl italic leading-snug sm:text-3xl">
              “Textiles que se ven mejor con la comida encima.”
            </p>
          </blockquote>
        </div>

        <ScallopBorder color="#1A1A1A" direction="up" className="mt-8" />
      </article>
    </>
  );
}
