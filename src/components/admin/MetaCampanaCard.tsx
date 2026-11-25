import { formatPercent } from "../../lib/admin";
import type { FilaDeOrigen } from "../../lib/admin-stats";
import { cn } from "../../lib/cn";
import { formatPrice } from "../../lib/format";
import {
  DESTINO_LABEL,
  ESTADO_LABEL,
  fechaLocal,
  type CampanaConNumeros,
  type Veredicto,
} from "../../lib/meta-ads";
import type { EstadoCampana } from "../../types/meta";

const ESTADO_CLASES: Record<EstadoCampana, string> = {
  activa: "bg-verde text-ink",
  en_revision: "bg-amarillo text-ink",
  completada: "bg-ink/10 text-ink/70",
  pausada: "bg-ink/10 text-ink/70",
  con_problema: "bg-orange text-ink",
};

const VEREDICTO: Record<Veredicto, { texto: string; clase: string }> = {
  barata: { texto: "Más barata que tu promedio", clase: "text-verde-ink" },
  cara: { texto: "Más cara que tu promedio", clase: "text-orange-ink" },
  normal: { texto: "En tu promedio", clase: "text-ink/65" },
  "pocos-datos": {
    texto: "Entró poca gente para comparar",
    clase: "text-ink/65",
  },
};

const corto = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
});

function fechas(inicio: string | null, fin: string | null): string {
  if (!inicio) return "";
  const desde = corto.format(fechaLocal(inicio));
  return fin && fin !== inicio
    ? `${desde} al ${corto.format(fechaLocal(fin))}`
    : desde;
}

function Dato({
  label,
  valor,
  nota,
}: {
  label: string;
  valor: string;
  nota?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-ink/65">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-sm font-medium tabular-nums">
        {valor}
        {nota && (
          <span className="block text-[11px] font-normal text-ink/65">
            {nota}
          </span>
        )}
      </dd>
    </div>
  );
}

type MetaCampanaCardProps = {
  campana: CampanaConNumeros;
  /** Lo que hizo en la tienda la gente que llegó de este anuncio. null cuando
   *  es de antes de que las visitas guardaran la campaña. */
  enLaTienda: FilaDeOrigen | null;
};

/** Una publicación promocionada, de arriba hacia abajo: qué es, cuánto salió,
 *  qué trajo y qué hizo esa gente en la tienda. */
export default function MetaCampanaCard({
  campana,
  enLaTienda,
}: MetaCampanaCardProps) {
  const { totales } = campana;
  const n = (valor: number) => valor.toLocaleString("es-AR");
  const plata = (valor: number) => formatPrice(Math.round(valor));
  const aLaTienda = campana.destino === "web";

  // Si la copia es vieja, una campaña puede figurar activa con la fecha vencida
  const vencida =
    campana.fin !== null &&
    fechaLocal(campana.fin).getTime() + 12 * 3_600_000 < Date.now();
  const estado: EstadoCampana = vencida ? "completada" : campana.estado;
  const veredicto = campana.veredicto && VEREDICTO[campana.veredicto];

  return (
    <li className="border-b border-ink/10 py-5 first:pt-0 last:border-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h3 className="text-base font-bold leading-snug">
            {campana.link ? (
              <a
                href={campana.link}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-ink/25 underline-offset-4 transition-colors hover:decoration-ink"
              >
                {campana.nombre}
              </a>
            ) : (
              campana.nombre
            )}
          </h3>
          <p className="mt-1 text-xs text-ink/65">
            {[fechas(campana.inicio, campana.fin), DESTINO_LABEL[campana.destino]]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-widest",
            ESTADO_CLASES[estado],
          )}
        >
          {ESTADO_LABEL[estado]}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
        <Dato
          label="Gastaste"
          valor={plata(totales.gasto)}
          nota={
            campana.presupuesto ? `de ${plata(campana.presupuesto)}` : undefined
          }
        />
        <Dato
          label="La vieron"
          valor={`${n(campana.alcance)} personas`}
          nota={`${n(totales.impresiones)} veces en total`}
        />
        {aLaTienda ? (
          <>
            <Dato
              label="Entraron"
              valor={n(totales.visitas)}
              nota={`a la tienda, de ${n(totales.clics)} clics`}
            />
            <Dato
              label="Cada visita"
              valor={
                campana.costoVisita === null ? "—" : plata(campana.costoVisita)
              }
            />
          </>
        ) : (
          <>
            <Dato label="Tocaron el botón" valor={n(totales.clics)} />
            <Dato
              label="Cada clic"
              valor={
                campana.costoClic === null ? "—" : plata(campana.costoClic)
              }
            />
          </>
        )}
        <Dato
          label="En Instagram"
          valor={`${n(totales.reacciones)} me gusta`}
          nota={`${n(totales.guardados)} ${totales.guardados === 1 ? "guardado" : "guardados"}`}
        />
      </dl>

      {(veredicto || enLaTienda) && (
        <div className="mt-4 space-y-1.5 text-xs leading-relaxed">
          {veredicto && (
            <p className={cn("font-semibold", veredicto.clase)}>
              {veredicto.texto}
            </p>
          )}
          {enLaTienda && (
            <p className="text-ink/70">
              <span className="font-semibold text-ink">En tu tienda:</span>{" "}
              {n(enLaTienda.sesiones)}{" "}
              {enLaTienda.sesiones === 1 ? "visita" : "visitas"},{" "}
              {formatPercent(enLaTienda.siguieron, 0)} miró más de una página,{" "}
              {formatPercent(enLaTienda.agregaron, 0)} agregó al carrito y{" "}
              {enLaTienda.pedidos === 0
                ? "no hubo pedidos"
                : `hubo ${n(enLaTienda.pedidos)} ${enLaTienda.pedidos === 1 ? "pedido" : "pedidos"}`}
              .
            </p>
          )}
        </div>
      )}
    </li>
  );
}
