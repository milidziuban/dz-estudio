import ScallopBorder from "./ScallopBorder";

const values = [
  {
    symbol: "✦",
    title: "Edición limitada",
    text: "Cuando se van, se van.",
  },
  {
    symbol: "✿",
    title: "Hecho en Argentina",
    text: "Diseño y confección locales, sin vueltas.",
  },
  {
    symbol: "✧",
    title: "Envíos a todo el país",
    text: "Andreani y Correo Argentino, de punta a punta.",
  },
];

export default function Values() {
  return (
    <section>
      <ScallopBorder color="#F4C542" direction="up" />
      <div className="border-y-[2.5px] border-ink bg-amarillo px-5 py-12 sm:px-8 md:py-16 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3 md:gap-8">
          {values.map((value) => (
            <div key={value.title}>
              <p className="text-3xl" aria-hidden="true">
                {value.symbol}
              </p>
              <h3 className="mt-3 font-mono text-sm font-medium uppercase tracking-widest">
                {value.title}
              </h3>
              <p className="mt-2 font-serif text-xl italic">{value.text}</p>
            </div>
          ))}
        </div>
      </div>
      <ScallopBorder color="#F4C542" direction="down" />
    </section>
  );
}
