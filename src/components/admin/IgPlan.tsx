import type { IgInforme } from "../../types/instagram";
import IgIdeas from "./IgIdeas";
import Panel from "./Panel";

function Lista({
  items,
  signo,
  clase,
}: {
  items: { que: string; porque: string }[];
  signo: string;
  clase: string;
}) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.que} className="flex gap-3">
          <span aria-hidden="true" className={`font-mono text-sm ${clase}`}>
            {signo}
          </span>
          <div>
            <p className="text-sm font-bold leading-snug">{item.que}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/65">
              {item.porque}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function IgPlan({ informe }: { informe: IgInforme }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Hacer">
          <Lista items={informe.hacer} signo="+" clase="text-verde-ink" />
        </Panel>
        <Panel title="No hacer">
          <Lista items={informe.noHacer} signo="−" clase="text-orange-ink" />
        </Panel>
      </div>

      <Panel title="Para probar" aside="de a una, así se sabe qué funcionó">
        <div className="grid gap-8 md:grid-cols-3">
          {informe.probar.map((p) => (
            <div key={p.que}>
              <h3 className="text-sm font-bold leading-snug">{p.que}</h3>
              <p className="mt-2 text-xs leading-relaxed text-ink/70">
                {p.como}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-ink/65">
                Qué mirar: {p.mirar}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Ideas para las próximas semanas"
        aside="la línea en cursiva es la primera del texto"
      >
        <IgIdeas ideas={informe.ideas} />
      </Panel>
    </div>
  );
}
