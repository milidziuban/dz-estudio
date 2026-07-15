import Seo from "../components/Seo";

export default function SobreNosotros() {
  return (
    <>
      <Seo
        title="Sobre nosotros"
        description="La historia y la filosofía de DZ Estudio: almohadones, individuales y bolsos en ediciones limitadas, diseñados y hechos en Argentina."
        path="/sobre-nosotros"
      />

      <article>
        {/* Hero editorial */}
        <header className="px-5 pt-14 sm:px-8 md:pt-20 lg:px-12">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-4 font-mono text-xs font-medium uppercase tracking-widest">
              ✦ Sobre nosotros
            </p>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
              Mucho color,{" "}
              <em className="font-serif font-normal italic text-pink">
                poca
              </em>{" "}
              improvisación.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed">
              Hacemos almohadones, individuales y bolsos en ediciones cortas,
              para gente a la que le importa lo que tiene en su casa.
            </p>
          </div>
        </header>

        {/* Foto grande */}
        <div className="px-5 py-12 sm:px-8 md:py-16 lg:px-12">
          <div
            className="mx-auto aspect-[16/9] max-w-5xl overflow-hidden rounded-2xl"
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
            <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Cómo{" "}
              <em className="font-serif font-normal italic text-petroleo">
                empezó
              </em>
            </h2>
            <p className="leading-relaxed">
              Empezamos por hartazgo de recorrer locales enteros y encontrar
              siempre lo mismo: almohadones lisos, individuales sin gracia y
              bolsos de tela que parecían todos el mismo bolso. Queríamos
              objetos con una paleta definida y un proceso cuidado detrás.
              Como no existían, los hicimos nosotros.
            </p>
            <p className="mt-4 leading-relaxed">
              La primera colección fueron ocho almohadones cosidos en un
              monoambiente de Villa Crespo, fotografiados sobre el único
              sillón que teníamos. Se agotaron en diez días. Ahí entendimos
              que no éramos los únicos cansados del beige.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
              En qué{" "}
              <em className="font-serif font-normal italic text-orange">
                creemos
              </em>
            </h2>
            <p className="leading-relaxed">
              Creemos en el maximalismo con criterio: dos colores que se
              eligen, nunca cinco que se acumulan. En que un bolso puede
              cargar la compra del súper y seguir siendo una pieza de diseño.
              En que las cosas lindas se usan — nuestros almohadones se ven
              mejor gastados de uso que nuevos en la caja.
            </p>
            <p className="mt-4 leading-relaxed">
              Y creemos, sobre todo, en no producir de más. Por eso trabajamos
              en ediciones limitadas: cuando se van, se van. No hay reposición
              eterna ni depósito lleno de saldos. Diseñamos una tirada, la
              hacemos bien, y pasamos a la que sigue.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Cómo lo{" "}
              <em className="font-serif font-normal italic text-verde">
                hacemos
              </em>
            </h2>
            <p className="leading-relaxed">
              Todo se diseña y se confecciona en Argentina, con talleres con los
              que trabajamos hace años y a los que les pagamos lo que
              corresponde. Elegimos algodones, linos y lonas que aguanten uso
              diario, lavados frecuentes y el paso del tiempo.
            </p>
          </section>

          <blockquote className="border-l-4 border-pink pl-6">
            <p className="font-serif text-2xl italic leading-snug sm:text-3xl">
              “Los objetos lindos se usan. No se guardan esperando la
              ocasión.”
            </p>
          </blockquote>
        </div>
      </article>
    </>
  );
}
