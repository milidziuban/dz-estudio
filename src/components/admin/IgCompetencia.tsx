import type { IgInforme } from "../../types/instagram";
import Panel from "./Panel";

export default function IgCompetencia({ informe }: { informe: IgInforme }) {
  const fuente = (id: string) => informe.fuentes.find((f) => f.id === id);
  const th =
    "px-3 py-2 text-left font-mono text-[10px] font-medium uppercase tracking-widest text-ink/65";

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        {informe.competencia.map((c) => (
          <Panel
            key={c.usuario}
            title={c.nombre}
            aside={
              <a
                href={`https://www.instagram.com/${c.usuario}/`}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 transition-colors hover:text-ink"
              >
                @{c.usuario} · {c.seguidores} seguidores
              </a>
            }
          >
            <ul className="space-y-2.5 text-sm leading-relaxed">
              {c.hace.map((h) => (
                <li key={h} className="flex gap-3">
                  <span aria-hidden="true" className="text-pink-ink">
                    ✦
                  </span>
                  {h}
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-3 border-t border-ink/10 pt-4 text-sm leading-relaxed">
              <div>
                <dt className="inline font-bold text-verde-ink">Para tomar: </dt>
                <dd className="inline">{c.tomar}</dd>
              </div>
              <div>
                <dt className="inline font-bold text-orange-ink">Para dejar: </dt>
                <dd className="inline">{c.dejar}</dd>
              </div>
            </dl>
          </Panel>
        ))}
      </div>

      <Panel title="Precios y condiciones" aside={`vistos en sus webs, ${informe.hasta.split("-").reverse().join("/")}`}>
        <div className="-mx-3 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/10">
                <th scope="col" className={th}>
                  <span className="sr-only">Qué</span>
                </th>
                <th scope="col" className={th}>
                  DZ Estudio
                </th>
                <th scope="col" className={th}>
                  Pulpa
                </th>
                <th scope="col" className={th}>
                  Coolhouse
                </th>
              </tr>
            </thead>
            <tbody>
              {informe.precios.map((p) => (
                <tr key={p.que} className="border-b border-ink/[0.06] align-top">
                  <th scope="row" className="px-3 py-3 text-left font-normal text-ink/65">
                    {p.que}
                  </th>
                  <td className="px-3 py-3 font-bold">{p.dz}</td>
                  <td className="px-3 py-3">{p.pulpa}</td>
                  <td className="px-3 py-3">{p.coolhouse}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-ink/65">
          {informe.lecturaPrecios}
        </p>
      </Panel>

      <Panel title="Qué pasa en el rubro">
        <ul className="max-w-3xl space-y-3 text-sm leading-relaxed">
          {informe.mercado.map((m) => {
            const f = fuente(m.fuente);
            return (
              <li key={m.dato} className="flex gap-3">
                <span aria-hidden="true" className="text-pink-ink">
                  ✦
                </span>
                <span>
                  {m.dato}
                  {f && (
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 font-mono text-[11px] text-lila-ink underline underline-offset-2"
                    >
                      {f.titulo.split(":")[0]}
                    </a>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="De dónde sale">
        <ol className="space-y-2.5 text-sm leading-relaxed">
          {informe.fuentes.map((f, i) => (
            <li key={f.id} className="flex gap-3">
              <span className="font-mono text-xs text-ink/65">[{i + 1}]</span>
              <span>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-ink/25 underline-offset-4 transition-colors hover:decoration-ink"
                >
                  {f.titulo}
                </a>
                <span className="block text-xs text-ink/65">{f.nota}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-5 max-w-3xl text-[11px] leading-relaxed text-ink/65">
          Los estudios miran millones de cuentas, casi ninguna argentina ni de
          este rubro, y los hacen empresas que venden herramientas. Sirven de
          orientación: cuando contradicen a tus números, mandan tus números.
        </p>
      </Panel>
    </div>
  );
}
