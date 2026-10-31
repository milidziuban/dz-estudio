import { Link } from "react-router-dom";
import { formatPercent } from "../../lib/admin";
import { proyeccionDelMes, type Profit } from "../../lib/admin-stats";
import { formatPrice } from "../../lib/format";
import Panel from "./Panel";

const mesFormatter = new Intl.DateTimeFormat("es-AR", { month: "long" });

type MetaDelMesProps = {
  /** Ganancia del mes calendario en curso */
  mes: Profit | null;
  meta: number;
};

/**
 * La meta mensual con lo que importa para decidir algo hoy: cuánto va, a qué
 * cierra si sigue así y cuánto por día falta para llegar. La marca sobre la
 * barra es el día del mes: si la barra verde queda detrás, vas atrasada.
 */
export default function MetaDelMes({ mes, meta }: MetaDelMesProps) {
  const now = new Date();
  const diasDelMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const diasQueQuedan = diasDelMes - now.getDate() + 1;
  const avanceDelMes = ((now.getDate() - 1) / diasDelMes) * 100;

  const ganancia = mes?.profit ?? 0;
  const avance = meta ? Math.min(100, Math.max(0, (ganancia / meta) * 100)) : 0;
  const proyeccion = proyeccionDelMes(ganancia, now);
  const falta = Math.max(0, meta - ganancia);

  return (
    <Panel
      title={`Meta de ${mesFormatter.format(now)}`}
      aside={
        <Link to="/admin/estadisticas?tab=meses" className="uppercase tracking-widest hover:text-ink">
          Mes a mes →
        </Link>
      }
      className="flex h-full flex-col"
    >
      {!mes ? (
        <p className="text-sm text-ink/65">Cargando los costos del catálogo…</p>
      ) : meta <= 0 ? (
        <p className="text-sm leading-relaxed text-ink/65">
          Todavía no hay una meta cargada.{" "}
          <Link to="/admin/precios" className="underline">
            Ponela en Precios →
          </Link>
        </p>
      ) : (
        <div className="flex flex-1 flex-col">
          <p className="font-mono text-3xl font-medium tracking-tight">
            {formatPrice(ganancia)}
          </p>
          <p className="mt-1 text-[11px] text-ink/65">
            de ganancia, sobre {formatPrice(meta)} ·{" "}
            {formatPercent(avance, avance < 10 ? 1 : 0)}
          </p>

          <div
            role="progressbar"
            aria-valuenow={Math.round(avance)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Avance de la meta de ganancia del mes"
            className="relative mt-5 h-2 rounded-full bg-ink/[0.07]"
          >
            <div
              className="h-full rounded-full bg-verde transition-[width]"
              style={{ width: `${avance}%` }}
            />
            <span
              aria-hidden="true"
              title="Hoy"
              className="absolute -top-1 h-4 w-px bg-ink/50"
              style={{ left: `${avanceDelMes}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[11px] uppercase tracking-widest text-ink/50">
            <span>1</span>
            <span>
              hoy · quedan {diasQueQuedan} {diasQueQuedan === 1 ? "día" : "días"}
            </span>
            <span>{diasDelMes}</span>
          </div>

          <dl className="mt-auto grid grid-cols-2 gap-3 pt-6">
            <div className="rounded-xl bg-cream/70 px-3.5 py-3">
              <dt className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink/65">
                A este ritmo
              </dt>
              <dd className="mt-1 font-mono text-sm font-medium">
                {proyeccion === null ? "—" : formatPrice(proyeccion)}
              </dd>
            </div>
            <div className="rounded-xl bg-cream/70 px-3.5 py-3">
              <dt className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink/65">
                {falta > 0 ? "Falta por día" : "Meta cumplida"}
              </dt>
              <dd className="mt-1 font-mono text-sm font-medium">
                {falta > 0 ? formatPrice(Math.ceil(falta / diasQueQuedan)) : "✦"}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </Panel>
  );
}
