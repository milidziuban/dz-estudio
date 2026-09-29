import { useEnvioNacional } from "../hooks/useEnvioNacional";
import { useInstallments } from "../hooks/useInstallments";
import { envioDetalle } from "../lib/envio-texto";

export default function Values() {
  const cuotas = useInstallments();
  const envio = useEnvioNacional();

  // Adentro del componente y no como constante del módulo: el texto de cuotas
  // sale de la base y puede llegar después del primer render.
  const values = [
    {
      symbol: "✦",
      title: "Envíos a todo el país",
      text: envioDetalle(envio),
    },
    {
      symbol: "✧",
      title: "Cuotas con tarjeta",
      text: `${cuotas.detail}. O 10% off pagando por transferencia.`,
    },
  ];

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
