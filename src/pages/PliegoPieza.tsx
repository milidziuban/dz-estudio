import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate, useParams } from "react-router-dom";
import PliegoCheck from "../components/pliego/PliegoCheck";
import PliegoCompra from "../components/pliego/PliegoCompra";
import PliegoDato from "../components/pliego/PliegoDato";
import PliegoFlecha from "../components/pliego/PliegoFlecha";
import PliegoPlano from "../components/pliego/PliegoPlano";
import PliegoSubbarra from "../components/pliego/PliegoSubbarra";
import PliegoTarjeta from "../components/pliego/PliegoTarjeta";
import Seo from "../components/Seo";
import { useEnvioNacional } from "../hooks/useEnvioNacional";
import {
  fotosDe,
  sumaPorSeparado,
  usePliego,
  type PliegoItem,
} from "../hooks/usePliego";
import { trackViewItem } from "../lib/analytics";
import { cn } from "../lib/cn";
import { envioFrase } from "../lib/envio-texto";
import { formatPrice } from "../lib/format";
import {
  PLIEGO_FUENTES,
  PLIEGO_PATH,
  SISTEMA,
  SISTEMA_COMPLETO,
  SOPORTE,
  rutaPieza,
  type PliegoTipo,
} from "../lib/pliego";
import { ancla, contenedor, paginaPliego, rotulo, tituloSeccion } from "../lib/pliego-clases";
import { SITE } from "../lib/site";
import {
  breadcrumbJsonLd,
  productJsonLd,
} from "../lib/structured-data";

const TIPO_ROTULO: Record<PliegoTipo, string> = {
  soporte: "La base",
  accesorio: "Accesorio",
  sistema: "Soporte + 5 accesorios",
};

/** Qué sugerir abajo: a un accesorio, el soporte y los otros accesorios; al
 *  soporte, los accesorios; al sistema, las piezas que trae. */
function sugerencias(actual: PliegoItem, items: PliegoItem[]): PliegoItem[] {
  const otros = items.filter((i) => i.pieza.slug !== actual.pieza.slug);
  if (actual.pieza.tipo === "accesorio") {
    return otros.filter((i) => i.pieza.tipo !== "sistema").slice(0, 3);
  }
  return otros.filter((i) => i.pieza.tipo === "accesorio").slice(0, 3);
}

export default function PliegoPieza() {
  const { slug } = useParams<{ slug: string }>();
  const { items, item } = usePliego();
  const envio = useEnvioNacional();
  const actual = item(slug);
  const [fotoIdx, setFotoIdx] = useState(0);

  useEffect(() => setFotoIdx(0), [slug]);

  // `view_item` una vez por ficha, y solo si la pieza ya existe en el panel:
  // sin producto no hay precio ni id que medir.
  const producto = actual?.producto;
  useEffect(() => {
    if (producto) trackViewItem(producto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producto?.slug]);

  if (!actual) return <Navigate to={PLIEGO_PATH} replace />;

  const { pieza } = actual;
  const fotos = fotosDe(actual);
  const foto = fotos[Math.min(fotoIdx, fotos.length - 1)];
  const sugeridos = sugerencias(actual, items);

  const separado = pieza.tipo === "sistema" ? sumaPorSeparado(items) : null;
  const ahorro =
    separado !== null && producto ? separado - producto.price : null;

  const migas = [
    { name: "Inicio", path: "/" },
    { name: "Pliego", path: PLIEGO_PATH },
    { name: pieza.nombre, path: rutaPieza(pieza.slug) },
  ];

  return (
    <div className={paginaPliego}>
      <Seo
        title={`${pieza.nombre} · Pliego`}
        description={pieza.bajada}
        image={
          fotos[0].src.startsWith("http")
            ? fotos[0].src
            : `${SITE.url}${fotos[0].src}`
        }
        path={rutaPieza(pieza.slug)}
        jsonLd={[
          ...(producto ? [productJsonLd(producto)] : []),
          breadcrumbJsonLd(migas),
        ]}
      />
      <Helmet>
        <link rel="stylesheet" href={PLIEGO_FUENTES} />
      </Helmet>

      <PliegoSubbarra />

      <div className={`${contenedor} pb-16 pt-8 md:pb-24 md:pt-10`}>
        <nav aria-label="Ruta" className={`${rotulo} text-pliego-tinta-suave`}>
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to={PLIEGO_PATH} className="hover:text-pliego-tinta">
                Pliego
              </Link>
            </li>
            {pieza.tipo === "accesorio" && (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link
                    to={`${PLIEGO_PATH}#accesorios`}
                    className="hover:text-pliego-tinta"
                  >
                    Accesorios
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-pliego-tinta">
              {pieza.nombre}
            </li>
          </ol>
        </nav>

        <div className="mt-6 grid gap-10 md:grid-cols-[7fr_5fr] md:gap-14">
          {/* Galería */}
          <div className="flex flex-col gap-3">
            <img
              key={`${foto.src}-${foto.posicion ?? ""}`}
              src={foto.src}
              alt={foto.alt}
              width={1379}
              height={649}
              fetchpriority="high"
              style={foto.posicion ? { objectPosition: foto.posicion } : undefined}
              className="block aspect-[4/3] w-full rounded-[10px] bg-pliego-linea object-cover"
            />
            {fotos.length > 1 && (
              <div className="flex flex-wrap gap-3">
                {fotos.map((f, i) => (
                  <button
                    key={`${f.src}-${f.posicion ?? i}`}
                    type="button"
                    aria-label={`Ver foto ${i + 1}`}
                    aria-pressed={fotoIdx === i}
                    onClick={() => setFotoIdx(i)}
                    className={cn(
                      "w-20 overflow-hidden rounded-[6px] transition-opacity",
                      fotoIdx === i
                        ? "ring-1 ring-pliego-tinta ring-offset-2 ring-offset-pliego-fondo"
                        : "opacity-60 hover:opacity-100",
                    )}
                  >
                    <img
                      src={f.src}
                      alt=""
                      loading="lazy"
                      style={f.posicion ? { objectPosition: f.posicion } : undefined}
                      className="block aspect-square w-full bg-pliego-linea object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info y compra */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <p className={`${rotulo} text-pliego-tinta-suave`}>
                {TIPO_ROTULO[pieza.tipo]}
              </p>
              <h1 className="text-[36px] font-medium leading-[1.1] tracking-[-0.01em] lg:text-[44px]">
                {pieza.nombre}
              </h1>
              <p className="text-lg leading-[29px]">{pieza.bajada}</p>
            </div>

            <div className="rounded-[10px] border border-pliego-linea bg-pliego-superficie p-5 md:p-6">
              <PliegoCompra item={actual} />
            </div>

            {pieza.tipo === "accesorio" && (
              <p className="flex flex-col gap-1 rounded-[10px] bg-pliego-salvia-suave px-5 py-4">
                <span className="font-medium">Encastra en el Soporte 24.</span>
                <span className="text-pliego-tinta-suave">
                  Si todavía no lo tenés, sumalo al mismo pedido.{" "}
                  <Link
                    to={rutaPieza(SOPORTE.slug)}
                    className="font-medium text-pliego-salvia-texto underline underline-offset-4"
                  >
                    Ver el soporte
                  </Link>
                </span>
              </p>
            )}

            <ul className="flex flex-col gap-2 text-[15px] leading-6 text-pliego-tinta-suave">
              <li>{envioFrase(envio)}</li>
              <li>
                Retiro gratis en {SITE.retiro.direccion}. {SITE.retiro.horario}.
              </li>
            </ul>

            <div className="flex flex-col gap-4 border-t border-pliego-linea pt-6">
              <p className="text-pliego-tinta-suave">{pieza.texto}</p>
              <ul className="flex flex-col gap-2.5">
                {pieza.usos.map((uso) => (
                  <li key={uso} className="flex items-start gap-2.5">
                    <span className="mt-1">
                      <PliegoCheck />
                    </span>
                    {uso}
                  </li>
                ))}
              </ul>
            </div>

            {pieza.tipo !== "soporte" && (
              <dl className="flex flex-col border-t border-pliego-linea">
                {pieza.datos.map((dato) => (
                  <PliegoDato
                    key={dato.rotulo}
                    rotulo={dato.rotulo}
                    valor={dato.valor}
                    className="border-b border-pliego-linea py-3.5"
                  />
                ))}
              </dl>
            )}
          </div>
        </div>

        {/* Sistema: qué trae, con link a cada pieza */}
        {pieza.tipo === "sistema" && (
          <section className="mt-16 rounded-[10px] bg-pliego-salvia-suave p-6 md:mt-24 md:p-12">
            <h2 className={tituloSeccion}>Qué trae</h2>
            <ul className="mt-6 grid gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {SISTEMA_COMPLETO.map((parte) => (
                <li key={parte.slug}>
                  <Link
                    to={rutaPieza(parte.slug)}
                    className="flex items-center gap-2.5 hover:underline"
                  >
                    <PliegoCheck />
                    {parte.nombre}
                  </Link>
                </li>
              ))}
            </ul>
            {ahorro !== null && ahorro > 0 && separado !== null && (
              <p className="mt-6 border-t border-pliego-salvia pt-5 text-pliego-salvia-texto">
                Por separado suman {formatPrice(separado)}: en el sistema
                ahorrás {formatPrice(ahorro)}.
              </p>
            )}
          </section>
        )}

        {/* Soporte: el plano con todas las medidas */}
        {pieza.tipo === "soporte" && (
          <section
            id="medidas"
            className={`mt-16 flex ${ancla} flex-wrap gap-x-14 gap-y-10 rounded-[10px] border border-pliego-linea bg-pliego-superficie p-6 md:mt-24 md:p-12`}
          >
            <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-8">
              <div className="flex flex-col gap-2">
                <h2 className={tituloSeccion}>Medidas</h2>
                <p className="text-pliego-tinta-suave">
                  Medí la base de tu monitor: tiene que entrar en la superficie
                  del soporte.
                </p>
              </div>
              <PliegoPlano />
            </div>
            <dl className="flex flex-[1_1_280px] flex-col">
              {pieza.datos.map((dato, i, todos) => (
                <PliegoDato
                  key={dato.rotulo}
                  rotulo={dato.rotulo}
                  valor={dato.valor}
                  className={
                    i < todos.length - 1
                      ? "border-b border-pliego-linea py-3.5"
                      : "py-3.5"
                  }
                />
              ))}
            </dl>
          </section>
        )}

        {/* Completá el escritorio */}
        <section className="mt-16 md:mt-24">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 className={tituloSeccion}>
              {pieza.tipo === "accesorio"
                ? "Completá el escritorio"
                : pieza.tipo === "soporte"
                  ? "Sumale accesorios"
                  : "Las piezas, una por una"}
            </h2>
            <Link
              to={`${PLIEGO_PATH}#${pieza.tipo === "sistema" ? "accesorios" : "armar"}`}
              className="inline-flex items-center gap-2 font-medium text-pliego-salvia-texto"
            >
              {pieza.tipo === "sistema" ? "Ver todo Pliego" : "Armalo en 3D"}{" "}
              <PliegoFlecha />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
            {sugeridos.map((s) => (
              <PliegoTarjeta key={s.pieza.slug} item={s} />
            ))}
          </div>
          {pieza.tipo !== "sistema" && (
            <Link
              to={rutaPieza(SISTEMA.slug)}
              className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[10px] bg-pliego-salvia-suave p-6 md:p-8"
            >
              <span className="flex flex-col gap-1">
                <span className="text-xl font-medium leading-7">
                  ¿Los querés todos? Sistema completo
                </span>
                <span className="text-pliego-tinta-suave">
                  {SISTEMA.bajada} Sale menos que por separado.
                </span>
              </span>
              <span className="inline-flex items-center gap-2 font-medium text-pliego-salvia-texto">
                Ver el sistema <PliegoFlecha />
              </span>
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}
