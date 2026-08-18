const values = [
  {
    symbol: "✦",
    title: "Envíos a todo el país",
    text: "Andreani, a sucursal o a domicilio.",
  },
  {
    symbol: "✧",
    title: "3 cuotas sin interés",
    text: "Hasta 6 con Cuotas Simples, o 10% off por transferencia.",
  },
];

export default function Values() {
  return (
    <section>
      <div className="bg-amarillo px-5 py-14 sm:px-8 md:py-20 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 sm:gap-8">
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
    </section>
  );
}
