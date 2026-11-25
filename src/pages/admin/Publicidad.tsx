import { useMemo, useState, type ReactNode } from "react";
import MetaCampanaCard from "../../components/admin/MetaCampanaCard";
import MetaGlosario from "../../components/admin/MetaGlosario";
import MetaPublicoList from "../../components/admin/MetaPublicoList";
import PageHeading from "../../components/admin/PageHeading";
import Panel from "../../components/admin/Panel";
import QueryError from "../../components/admin/QueryError";
import RangeTabs from "../../components/admin/RangeTabs";
import StatCard from "../../components/admin/StatCard";
import TrendChart from "../../components/admin/TrendChart";
import Button from "../../components/Button";
import { useAdminOrders } from "../../hooks/useAdminOrders";
import { useActualizarMeta, useMetaAds } from "../../hooks/useMetaAds";
import { useStoreEvents } from "../../hooks/useStoreEvents";
import { useVisits } from "../../hooks/useVisits";
import {
  downloadCsv,
  errorMessage,
  formatDate,
  formatPercent,
  rangeStart,
  timeAgo,
  type RangeId,
} from "../../lib/admin";
import {
  bucketFor,
  buildSeries,
  eventsIn,
  ordersIn,
  porCampana,
  resumirSesiones,
  visitsIn,
} from "../../lib/admin-stats";
import { formatPrice } from "../../lib/format";
import {
  campanasConNumeros,
  compararDias,
  costoPorVisita,
  diasEntre,
  fechaLocal,
  MIN_VISITAS,
  publicoDe,
  sumarDias,
  type LadoDeLaComparacion,
} from "../../lib/meta-ads";
import { META_PIXEL_ID } from "../../lib/meta-pixel";
import type { TipoPublico } from "../../types/meta";

const n = (valor: number) => valor.toLocaleString("es-AR");
const plata = (valor: number) => formatPrice(Math.round(valor));

/** Desde cuándo las visitas guardan de qué anuncio vinieron */
const DESDE_CAMPANA = "30/10";

const PUBLICOS: { tipo: TipoPublico; titulo: string }[] = [
  { tipo: "provincia", titulo: "Dónde vive" },
  { tipo: "edad", titulo: "Qué edad tiene" },
  { tipo: "sexo", titulo: "Mujeres y varones" },
  { tipo: "lugar", titulo: "Dónde apareció" },
];

function Lado({
  titulo,
  lado,
}: {
  titulo: string;
  lado: LadoDeLaComparacion;
}) {
  const decimal = (valor: number) =>
    valor.toLocaleString("es-AR", { maximumFractionDigits: 1 });
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-widest text-ink/65">
        {titulo} · {n(lado.dias)} {lado.dias === 1 ? "día" : "días"}
      </p>
      <p className="mt-2 font-mono text-2xl font-medium tabular-nums">
        {decimal(lado.sesiones)}
        <span className="ml-2 text-xs font-normal text-ink/65">
          visitas por día
        </span>
      </p>
      <p className="mt-1 text-xs leading-relaxed text-ink/65">
        {decimal(lado.deRedes)} llegaron desde Instagram o Facebook
      </p>
      <p className="mt-3 text-sm">
        {lado.ventas === 0
          ? "Sin ventas cobradas"
          : `${n(lado.ventas)} ${lado.ventas === 1 ? "venta" : "ventas"} · ${plata(lado.facturacion)}`}
      </p>
    </div>
  );
}

export default function AdminPublicidad() {
  const [range, setRange] = useState<RangeId>("all");
  const meta = useMetaAds();
  const actualizar = useActualizarMeta();
  const orders = useAdminOrders();
  const visits = useVisits(range);
  const events = useStoreEvents(range);

  const datos = meta.data;
  const sync = datos?.sync ?? null;
  const sinConectar = actualizar.data?.conectado === false;

  const vista = useMemo(() => {
    if (!datos || datos.dias.length === 0) return null;

    const to = new Date();
    const primerDia = fechaLocal(datos.dias[0].fecha);
    primerDia.setHours(0, 0, 0, 0);
    // "Todo" arranca con el primer anuncio, y un rango más largo que eso
    // también: antes no hay nada que mostrar ni contra qué comparar.
    const elegido = rangeStart(range);
    const from = elegido && elegido > primerDia ? elegido : primerDia;

    const dias = diasEntre(datos.dias, from, to);
    const campanas = campanasConNumeros(datos.campanas, dias).sort((a, b) =>
      (b.inicio ?? "").localeCompare(a.inicio ?? ""),
    );
    const visitas = visitsIn(visits.data ?? [], from, to);
    const sesiones = resumirSesiones(
      visitas,
      eventsIn(events.data ?? [], from, to),
    );

    const period = { from, to, prevFrom: null, prevTo: null };
    const serie = buildSeries(
      dias.map((d) => ({ date: fechaLocal(d.fecha), value: d.gasto })),
      period,
      // Los anuncios se miden por día: por hora no hay dato
      range === "hoy" ? "day" : bucketFor(from, to),
    );

    return {
      campanas,
      totales: sumarDias(dias),
      costoVisita: costoPorVisita(campanas),
      serie,
      porCampana: new Map(porCampana(sesiones).map((f) => [f.label, f])),
      comparacion: compararDias(
        dias,
        visitas,
        ordersIn(orders.data ?? [], from, to),
        from,
        to,
      ),
    };
  }, [datos, range, visits.data, events.data, orders.data]);

  // ── Lo que dicen los números, en frases ─────────────────────
  const frases: ReactNode[] = [];
  if (vista && vista.campanas.length > 0) {
    const { totales, campanas, costoVisita } = vista;
    const personas = range === "all" ? (sync?.alcanceTotal ?? null) : null;
    const publicaciones =
      campanas.length === 1
        ? "1 publicación"
        : `${n(campanas.length)} publicaciones`;

    frases.push(
      <>
        Gastaste <strong>{plata(totales.gasto)}</strong> en {publicaciones}.{" "}
        {personas
          ? `Las vieron ${n(personas)} personas`
          : `Se vieron ${n(totales.impresiones)} veces`}{" "}
        y <strong>{n(totales.visitas)}</strong>{" "}
        {totales.visitas === 1 ? "entró" : "entraron"} a la tienda
        {costoVisita !== null && (
          <>
            : cada visita costó <strong>{plata(costoVisita)}</strong>
          </>
        )}
        .
      </>,
    );

    const comparables = campanas
      .filter((c) => c.costoVisita !== null && c.totales.visitas >= MIN_VISITAS)
      .sort((a, b) => a.costoVisita! - b.costoVisita!);
    if (comparables.length >= 2) {
      const mejor = comparables[0];
      const peor = comparables[comparables.length - 1];
      frases.push(
        <>
          La que mejor rindió es <strong>{mejor.nombre}</strong> (
          {plata(mejor.costoVisita!)} por visita). La más cara,{" "}
          <strong>{peor.nombre}</strong> ({plata(peor.costoVisita!)}).
        </>,
      );
    }

    frases.push(
      totales.compras > 0 ? (
        <>
          Meta cuenta{" "}
          <strong>
            {n(totales.compras)} {totales.compras === 1 ? "compra" : "compras"}
          </strong>{" "}
          por {plata(totales.valorCompras)} de gente que tocó un anuncio.
        </>
      ) : (
        <>
          Meta <strong>no registra ninguna compra</strong> que venga de un
          anuncio en este período.
        </>
      ),
    );

    const alPerfil = campanas.filter((c) => c.destino === "perfil");
    if (alPerfil.length > 0) {
      const gasto = alPerfil.reduce((t, c) => t + c.totales.gasto, 0);
      frases.push(
        <>
          <strong>{plata(gasto)}</strong> (
          {formatPercent((gasto / totales.gasto) * 100, 0)}) se fueron en{" "}
          {alPerfil.length === 1
            ? "una publicación que manda"
            : `${n(alPerfil.length)} publicaciones que mandan`}{" "}
          al perfil de Instagram y no a la tienda.
        </>,
      );
    }
  }

  const publicos = PUBLICOS.map((p) => ({
    ...p,
    filas: publicoDe(datos?.publico ?? [], p.tipo),
  })).filter((p) => p.filas.length > 0);

  const errorDeMeta =
    actualizar.data?.error ??
    (actualizar.error
      ? errorMessage(actualizar.error, "No se pudo hablar con Meta")
      : null);

  return (
    <>
      <PageHeading
        title={
          <>
            Publicidad en{" "}
            <em className="font-serif font-normal italic text-pink-ink">
              Instagram
            </em>
          </>
        }
        description="Cuánto pusiste en promocionar publicaciones y qué trajo, sin entrar al Administrador de anuncios."
      >
        <RangeTabs value={range} onChange={setRange} />
      </PageHeading>

      {meta.error ? (
        <QueryError
          error={meta.error}
          what="la publicidad"
          migration="supabase/migrations/20261125003443_publicidad_meta.sql"
        />
      ) : meta.isLoading ? (
        <p role="status" className="py-16 text-center text-sm text-ink/65">
          Cargando…
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <p className="text-xs leading-relaxed text-ink/65">
              {!sync
                ? "Todavía no se leyó nada de Meta."
                : sync.origen === "api"
                  ? `Números de Meta leídos ${timeAgo(sync.actualizado)}.`
                  : `Números copiados de Meta el ${formatDate(sync.actualizado)}. No se actualizan solos hasta conectar la cuenta.`}
            </p>
            {!sinConectar && (
              <Button
                variant="secondary"
                className="px-5 py-2.5"
                disabled={actualizar.isPending}
                onClick={() => actualizar.mutate(true)}
              >
                {actualizar.isPending ? "Leyendo Meta…" : "Actualizar"}
              </Button>
            )}
          </div>

          {errorDeMeta && (
            <p
              role="alert"
              className="rounded-2xl bg-white p-5 text-sm leading-relaxed"
            >
              <span className="font-semibold text-orange-ink">
                No se pudo actualizar.
              </span>{" "}
              Lo que ves es lo último que se guardó.
              <span className="mt-2 block font-mono text-xs text-ink/65">
                {errorDeMeta}
              </span>
            </p>
          )}

          {!vista || vista.campanas.length === 0 ? (
            <Panel title="Sin anuncios">
              <p className="py-8 text-center text-sm text-ink/65">
                No hubo publicaciones promocionadas en este período.
              </p>
            </Panel>
          ) : (
            <>
              <Panel title="En pocas palabras">
                <ul className="max-w-3xl space-y-2.5 text-sm leading-relaxed sm:text-base">
                  {frases.map((frase, i) => (
                    <li key={i} className="flex gap-3">
                      <span aria-hidden="true" className="text-pink-ink">
                        ✦
                      </span>
                      <span>{frase}</span>
                    </li>
                  ))}
                </ul>
              </Panel>

              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <StatCard
                  label="Gastaste"
                  value={plata(vista.totales.gasto)}
                  hint={`en ${n(vista.campanas.length)} ${vista.campanas.length === 1 ? "publicación" : "publicaciones"}`}
                />
                <StatCard
                  label="Se vio"
                  value={n(vista.totales.impresiones)}
                  hint={
                    range === "all" && sync?.alcanceTotal
                      ? `por ${n(sync.alcanceTotal)} personas`
                      : undefined
                  }
                />
                <StatCard
                  label="Entraron"
                  value={n(vista.totales.visitas)}
                  hint={`a la tienda, de ${n(vista.totales.clics)} clics`}
                />
                <StatCard
                  label="Por visita"
                  value={
                    vista.costoVisita === null ? "—" : plata(vista.costoVisita)
                  }
                  hint="sin contar las que van al perfil"
                />
              </div>

              <Panel
                title="Publicación por publicación"
                aside={
                  <button
                    type="button"
                    className="underline underline-offset-4 transition-colors hover:text-ink"
                    onClick={() =>
                      downloadCsv(
                        `dz-publicidad-${range}.csv`,
                        vista.campanas.map((c) => ({
                          Publicacion: c.nombre,
                          Desde: c.inicio ?? "",
                          Hasta: c.fin ?? "",
                          Destino: c.destino,
                          Presupuesto: c.presupuesto ?? "",
                          Gasto: Math.round(c.totales.gasto),
                          Personas: c.alcance,
                          Impresiones: c.totales.impresiones,
                          Clics: c.totales.clics,
                          "Visitas a la tienda": c.totales.visitas,
                          "Costo por visita":
                            c.costoVisita === null
                              ? ""
                              : Math.round(c.costoVisita),
                          "Me gusta": c.totales.reacciones,
                          Guardados: c.totales.guardados,
                          "Compras segun Meta": c.totales.compras,
                        })),
                      )
                    }
                  >
                    Bajar CSV
                  </button>
                }
              >
                <ul>
                  {vista.campanas.map((campana) => (
                    <MetaCampanaCard
                      key={campana.id}
                      campana={campana}
                      enLaTienda={vista.porCampana.get(campana.id) ?? null}
                    />
                  ))}
                </ul>
                <p className="mt-5 border-t border-ink/10 pt-4 text-[11px] leading-relaxed text-ink/65">
                  "En tu tienda" lo cuenta la tienda y no Meta, desde el{" "}
                  {DESDE_CAMPANA}. Los dos números nunca dan igual: Meta descarta
                  a quien bloquea el seguimiento y la tienda cuenta cada visita.
                </p>
              </Panel>

              <Panel title="Lo que gastaste en el tiempo">
                <TrendChart
                  points={vista.serie}
                  formatValue={plata}
                  summaryLabel="Total del período"
                  summaryValue={plata(vista.totales.gasto)}
                />
              </Panel>

              {vista.comparacion && (
                <Panel title="¿Se nota en la tienda?">
                  <div className="grid gap-8 sm:grid-cols-2">
                    <Lado
                      titulo="Con un anuncio corriendo"
                      lado={vista.comparacion.con}
                    />
                    <Lado
                      titulo="Los demás días"
                      lado={vista.comparacion.sin}
                    />
                  </div>
                  <p className="mt-5 text-[11px] leading-relaxed text-ink/65">
                    Que una venta caiga en un día con anuncio no prueba que vino
                    de ahí, y alguien puede ver un anuncio y comprar la semana
                    siguiente.
                  </p>
                </Panel>
              )}

              {publicos.length > 0 && (
                <Panel
                  title="A quién se le mostró"
                  aside="desde el primer anuncio · % de lo gastado"
                >
                  <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
                    {publicos.map((p) => (
                      <div key={p.tipo}>
                        <h3 className="mb-4 text-sm font-bold">{p.titulo}</h3>
                        <MetaPublicoList filas={p.filas} />
                      </div>
                    ))}
                  </div>
                </Panel>
              )}

              <MetaGlosario />

              {sinConectar && (
                <Panel title="Falta conectar la cuenta">
                  <p className="max-w-2xl text-sm leading-relaxed text-ink/70">
                    Para que esta pantalla se actualice sola hace falta una clave de
                    lectura de Meta, que se crea una sola vez. Solo puede mirar: no
                    puede gastar ni cambiar anuncios. El paso a paso está en{" "}
                    <code className="font-mono text-xs">PANEL-ADMIN.md</code>,
                    sección "Publicidad".
                  </p>
                </Panel>
              )}

              <p className="pt-2 text-[11px] leading-relaxed text-ink/65">
                Esta pantalla solo lee: para crear, pausar o cambiar un anuncio
                hay que hacerlo en Instagram o en Meta. Pixel{" "}
                {META_PIXEL_ID ? "activo" : "apagado"}.
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}
