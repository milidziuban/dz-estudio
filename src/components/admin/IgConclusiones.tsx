import { cn } from "../../lib/cn";
import type { IgInforme } from "../../types/instagram";

/** Qué dicen los datos, de lo más importante a lo menos. Cada una trae su
 *  prueba y qué hacer con eso. */
export default function IgConclusiones({ informe }: { informe: IgInforme }) {
  const numeroDe = new Map(informe.fuentes.map((f, i) => [f.id, i + 1]));

  return (
    <div className="space-y-3">
      <section className="rounded-2xl bg-ink p-6 text-cream sm:p-8">
        <p className="max-w-3xl text-lg leading-relaxed sm:text-xl">
          {informe.enUnaFrase}
        </p>
      </section>

      <ol className="grid gap-3 lg:grid-cols-2">
        {informe.conclusiones.map((c, i) => (
          <li
            key={c.titulo}
            className="flex flex-col rounded-2xl bg-white p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-base font-bold leading-snug sm:text-lg">
                {i + 1}. {c.titulo}
              </h3>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-widest text-ink",
                  c.fuerza === "firme" ? "bg-verde" : "bg-amarillo",
                )}
              >
                {c.fuerza}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink/70">
              {c.dato}
              {c.fuentes?.map((id) => {
                const numero = numeroDe.get(id);
                const fuente = informe.fuentes.find((f) => f.id === id);
                if (!numero || !fuente) return null;
                return (
                  <a
                    key={id}
                    href={fuente.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Fuente: ${fuente.titulo}`}
                    title={fuente.titulo}
                    className="ml-1.5 font-mono text-[11px] text-lila-ink underline underline-offset-2"
                  >
                    [{numero}]
                  </a>
                );
              })}
            </p>
            <p className="mt-auto pt-4 text-sm font-semibold leading-relaxed">
              <span aria-hidden="true" className="mr-2 text-pink-ink">
                ✦
              </span>
              {c.hacer}
            </p>
          </li>
        ))}
      </ol>

      <p className="text-[11px] leading-relaxed text-ink/65">
        Firme: los datos alcanzan para decirlo. Pista: apunta para ahí, pero son
        pocas publicaciones y hay que seguir mirando.
      </p>
    </div>
  );
}
