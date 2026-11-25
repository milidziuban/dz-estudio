import { useMemo, useState } from "react";
import { formatPercent } from "../../lib/admin";
import { buildSeries } from "../../lib/admin-stats";
import {
  agruparPosts,
  espectadoresDeHistorias,
  feedDe,
  IG_TEMA_LABEL,
  IG_TIPO_LABEL,
  maduras,
  sumarIgDias,
  type GrupoIg,
} from "../../lib/instagram";
import { fechaLocal } from "../../lib/meta-ads";
import type { IgDatos, IgInforme, IgTema, IgTipo } from "../../types/instagram";
import Panel from "./Panel";
import SectionTabs from "./SectionTabs";
import StatCard from "./StatCard";
import TrendChart from "./TrendChart";

const n = (valor: number) =>
  Math.round(valor).toLocaleString("es-AR");

const METRICAS = [
  { id: "visitas", label: "Visitas al perfil" },
  { id: "seguidores", label: "Seguidores nuevos" },
  { id: "vistas", label: "Vistas" },
] as const;
type Metrica = (typeof METRICAS)[number]["id"];

function TablaGrupos({
  grupos,
  primera,
  nombre,
}: {
  grupos: GrupoIg[];
  primera: string;
  nombre: (clave: string) => string;
}) {
  const th =
    "px-3 py-2 text-right font-mono text-[10px] font-medium uppercase tracking-widest text-ink/65";
  const td = "px-3 py-2.5 text-right font-mono text-xs tabular-nums";
  return (
    <div className="-mx-3 overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse">
        <thead>
          <tr className="border-b border-ink/10">
            <th scope="col" className={`${th} text-left`}>
              {primera}
            </th>
            <th scope="col" className={th}>
              Cuántas
            </th>
            <th scope="col" className={th}>
              Personas
            </th>
            <th scope="col" className={th}>
              Hacen algo
            </th>
            <th scope="col" className={th}>
              Guardados
            </th>
          </tr>
        </thead>
        <tbody>
          {grupos.map((g) => (
            <tr key={g.clave} className="border-b border-ink/[0.06]">
              <td className="px-3 py-2.5 text-sm">{nombre(g.clave)}</td>
              <td className={`${td} text-ink/65`}>{g.cantidad}</td>
              <td className={td}>{n(g.alcance)}</td>
              <td className={td}>{formatPercent(g.tasa, 1)}</td>
              <td className={td}>{g.guardados}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const PUBLICOS = [
  { tipo: "edad", titulo: "Edad" },
  { tipo: "sexo", titulo: "Mujeres y varones" },
  { tipo: "ciudad", titulo: "Ciudades" },
] as const;

export default function IgNumeros({
  datos,
  informe,
}: {
  datos: IgDatos;
  informe: IgInforme & { fecha: string };
}) {
  const [metrica, setMetrica] = useState<Metrica>("visitas");

  const vista = useMemo(() => {
    const feed = maduras(feedDe(datos.posts), informe.fecha);
    const period = {
      from: fechaLocal(informe.desde),
      to: fechaLocal(informe.hasta),
      prevFrom: null,
      prevTo: null,
    };
    return {
      totales: sumarIgDias(datos.dias),
      historias: espectadoresDeHistorias(datos.posts),
      porTipo: agruparPosts(feed, (p) => p.tipo),
      porTema: agruparPosts(feed, (p) => p.tema),
      serie: buildSeries(
        datos.dias.map((d) => ({
          date: fechaLocal(d.fecha),
          value: d[metrica],
        })),
        period,
        "week",
      ),
    };
  }, [datos, informe, metrica]);

  const { totales } = vista;
  const metricaLabel = METRICAS.find((m) => m.id === metrica)!.label;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Seguidores"
          value={n(informe.perfil.seguidores)}
          hint={`${n(totales.seguidores)} nuevos en el período`}
        />
        <StatCard
          label="Al perfil"
          value={n(totales.visitas)}
          hint="visitas en el período"
        />
        <StatCard
          label="Historias"
          value={n(vista.historias)}
          hint={`personas las ven, ${formatPercent((vista.historias / informe.perfil.seguidores) * 100, 0)} de tus seguidores`}
        />
        <StatCard
          label="Clics"
          value={n(totales.clics)}
          hint="en links, con los de la pauta"
        />
      </div>

      <section className="rounded-2xl bg-white p-5 sm:p-6">
        <SectionTabs
          tabs={METRICAS}
          value={metrica}
          onChange={setMetrica}
          label="Qué mostrar en el gráfico"
        />
        <TrendChart
          points={vista.serie}
          formatValue={n}
          summaryLabel={`${metricaLabel} por semana`}
          summaryValue={n(totales[metrica])}
        />
      </section>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Qué formato rinde" aside="sin contar la pauta">
          <TablaGrupos
            grupos={vista.porTipo}
            primera="Formato"
            nombre={(k) => IG_TIPO_LABEL[k as IgTipo]}
          />
        </Panel>
        <Panel title="Qué tema rinde" aside="sin contar la pauta">
          <TablaGrupos
            grupos={vista.porTema}
            primera="Tema"
            nombre={(k) => IG_TEMA_LABEL[k as IgTema]}
          />
        </Panel>
      </div>
      <p className="text-[11px] leading-relaxed text-ink/65">
        Personas y "hacen algo" son el valor del medio de cada grupo; los
        guardados son el total, con los de la pauta. Las publicaciones de los
        últimos tres días no entran: todavía están juntando. Con una o dos por
        grupo, tomalo como una pista.
      </p>

      <Panel title="Quién te sigue" aside="% de tus seguidores">
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-3">
          {PUBLICOS.map((p) => {
            const filas = datos.publico
              .filter((f) => f.tipo === p.tipo)
              .sort((a, b) =>
                p.tipo === "edad"
                  ? a.valor.localeCompare(b.valor)
                  : b.parte - a.parte,
              );
            const max = Math.max(...filas.map((f) => f.parte), 1);
            return (
              <div key={p.tipo}>
                <h3 className="mb-4 text-sm font-bold">{p.titulo}</h3>
                <ul className="space-y-3">
                  {filas.map((f) => (
                    <li key={f.valor}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate">{f.valor}</span>
                        <span className="font-mono text-xs tabular-nums">
                          {formatPercent(f.parte, 1)}
                        </span>
                      </div>
                      <div
                        aria-hidden="true"
                        className="mt-1.5 h-1 rounded-full bg-ink/[0.07]"
                      >
                        <div
                          className="h-full rounded-full bg-petroleo"
                          style={{ width: `${(f.parte / max) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
