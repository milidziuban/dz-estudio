import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import PliegoArmador from "../components/pliego/PliegoArmador";
import PliegoDato from "../components/pliego/PliegoDato";
import PliegoEspera from "../components/pliego/PliegoEspera";
import PliegoFlecha from "../components/pliego/PliegoFlecha";
import PliegoPrecio from "../components/pliego/PliegoPrecio";
import PliegoSubbarra from "../components/pliego/PliegoSubbarra";
import PliegoTarjeta from "../components/pliego/PliegoTarjeta";
import Seo from "../components/Seo";
import { useEnvioNacional } from "../hooks/useEnvioNacional";
import { useInstallments } from "../hooks/useInstallments";
import { fotosDe, usePliego } from "../hooks/usePliego";
import { useStoreSettings } from "../hooks/useStoreSettings";
import { cn } from "../lib/cn";
import { envioFraseCorta } from "../lib/envio-texto";
import {
  DATOS_PORTADA,
  PLIEGO_CARGA_KG,
  PLIEGO_FUENTES,
  SISTEMA,
  SOPORTE,
  rutaPieza,
} from "../lib/pliego";
import {
  ancla,
  botonPrimario,
  contenedor,
  paginaPliego,
  rotulo,
  tituloSeccion,
} from "../lib/pliego-clases";
import { DEFAULT_PROMOS } from "../lib/promos";
import { SITE } from "../lib/site";

/** Lo que resuelve el Soporte 24. Va al lado de su foto, en "La base". */
const BENEFICIOS: { titulo: string; texto: string }[] = [
  {
    titulo: "Libera la mesa",
    texto:
      "Debajo quedan unos 90 mm libres. Al terminar el día, el teclado entra ahí y el escritorio queda despejado.",
  },
  {
    titulo: "Una sola pieza",
    texto:
      "Chapa de acero de 1,5 mm cortada y plegada. Sin tornillos ni soldaduras: no hay nada que se afloje con el tiempo.",
  },
  {
    titulo: "Se arma a tu manera",
    texto:
      "Doce ranuras: seis adelante para lo que usás todo el día y seis atrás para llevar los cables.",
  },
];

export default function Pliego() {
  const envio = useEnvioNacional();
  const cuotas = useInstallments();
  const { data: settings } = useStoreSettings();
  const promos = settings?.marketing.promos ?? DEFAULT_PROMOS;
  const { items, item } = usePliego();

  const soporte = item(SOPORTE.slug)!;
  const sistema = item(SISTEMA.slug)!;
  const accesorios = items.filter((i) => i.pieza.tipo === "accesorio");
  // En "La base" va el detalle de las ranuras: la foto entera ya está en la
  // portada. Si el panel carga menos fotos, la primera.
  const fotosSoporte = fotosDe(soporte);
  const fotoBase = fotosSoporte[2] ?? fotosSoporte[0];
  const enEspera = soporte.estado === "espera";

  const preguntas: { q: string; a: string }[] = [
    {
      q: "¿Entra mi monitor?",
      a: "La base del monitor tiene que entrar en la superficie de 596,9 × 228,6 mm. Medí el pie de tu monitor y compará.",
    },
    ...(PLIEGO_CARGA_KG !== null
      ? [
          {
            q: "¿Cuánto peso aguanta?",
            a: `Hasta ${PLIEGO_CARGA_KG} kg apoyados en el centro.`,
          },
        ]
      : []),
    {
      q: "¿Los accesorios sirven sin el soporte?",
      a: "No: encastran en las ranuras del Soporte 24. Si todavía no lo tenés, sumalo al mismo pedido o llevate el Sistema completo.",
    },
    {
      q: "¿Puedo comprar los accesorios sueltos?",
      a: "Sí. Empezá con el soporte y sumá accesorios cuando los necesites. Si los querés todos, el Sistema completo sale menos.",
    },
    {
      q: "¿Cómo se limpia?",
      a: "Con un paño húmedo, sin productos abrasivos. El panel de flujo se borra en seco, con un paño o un borrador.",
    },
    {
      q: "¿Cómo me llega?",
      a: `Podés retirarlo gratis en ${SITE.retiro.direccion}, de ${SITE.retiro.horario.toLowerCase()}. ${envioFraseCorta(envio)}.`,
    },
    {
      q: "¿Cómo lo pago?",
      a: [
        promos.transferencia.enabled
          ? `Por transferencia, con ${promos.transferencia.percent} % de descuento.`
          : null,
        "Con Mercado Pago: crédito, débito o efectivo en Pago Fácil y Rapipago.",
        `${cuotas.detail}.`,
      ]
        .filter(Boolean)
        .join(" "),
    },
  ];

  return (
    <div className={paginaPliego}>
      <Seo
        title="Pliego, objetos de escritorio"
        description="Pliego, de DZ Estudio: un soporte de monitor de una sola pieza de acero, con accesorios que encastran en sus ranuras."
        image={`${SITE.url}/pliego/og-pliego.jpg`}
        path="/pliego"
      />
      <Helmet>
        <link rel="stylesheet" href={PLIEGO_FUENTES} />
      </Helmet>

      <PliegoSubbarra />

      {/* Portada: el titular y, mientras no se vende, la lista de espera.
          Texto y foto entran juntos en la primera pantalla; en el celular la
          foto va entre el titular y el texto, así se ve el producto sin bajar. */}
      <section className={`${contenedor} pb-16 pt-8 md:pb-24 lg:pt-10`}>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-x-12 lg:gap-y-8">
          <div className="flex flex-col items-start gap-5 motion-safe:animate-pliego-entrar lg:order-1 lg:col-span-6">
            <p className={`${rotulo} flex flex-wrap items-center gap-3 text-pliego-tinta-suave`}>
              Soporte 24 · Acero plegado
              {enEspera && (
                <span className="rounded-sm bg-pliego-salvia-suave px-2 py-1 text-pliego-salvia-texto">
                  Próximamente
                </span>
              )}
            </p>
            <h1 className="max-w-[13ch] text-[44px] font-medium leading-[1.04] tracking-[-0.025em] sm:text-[56px] lg:text-[60px]">
              Tu escritorio,{" "}
              <span className="whitespace-nowrap">más ordenado.</span>
            </h1>
            <a
              href="#armar"
              className="inline-flex min-h-11 items-center gap-2 self-start text-[15px] font-medium text-pliego-salvia-texto"
            >
              Probalo en 3D <PliegoFlecha />
            </a>
          </div>
          <img
            src="/pliego/soporte-24-escritorio.webp"
            alt="Soporte 24 en un escritorio, con el monitor encima, el celular, la bandeja y los auriculares colgados de sus ranuras"
            width={1379}
            height={649}
            fetchpriority="high"
            className="block aspect-[2.12/1] w-full rounded-[10px] bg-pliego-linea object-cover object-[50%_40%] [animation-delay:120ms] motion-safe:animate-pliego-entrar lg:order-3 lg:col-span-12 lg:aspect-[2.8/1]"
          />
          <div className="flex flex-col gap-4 motion-safe:animate-pliego-entrar lg:order-2 lg:col-span-6">
            <p className="max-w-[60ch] text-balance text-lg leading-[29px]">
              Soporte de monitor de acero, con accesorios que encastran en sus
              ranuras.
            </p>
            {/* Antes del lanzamiento lo que se puede hacer acá es anotarse:
                el botón de compra recién aparece al final de la ficha. */}
            {enEspera ? (
              <PliegoEspera
                compacta
                texto="Dejá tu mail y te avisamos cuando salgan las primeras unidades."
              />
            ) : (
              <Link to={rutaPieza(SOPORTE.slug)} className={`${botonPrimario} self-start`}>
                {soporte.estado === "venta" ? "Comprar el Soporte 24" : "Ver el Soporte 24"}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* La base: la foto queda quieta mientras se lee lo que resuelve */}
      <section id="soporte" className={`${contenedor} ${ancla} py-16 md:py-24`}>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <Link
            to={rutaPieza(SOPORTE.slug)}
            className="group block self-start overflow-hidden rounded-[10px] bg-pliego-linea lg:sticky lg:top-40 lg:col-span-7"
          >
            <img
              src={fotoBase.src}
              alt={fotoBase.alt}
              width={1379}
              height={649}
              loading="lazy"
              style={fotoBase.posicion ? { objectPosition: fotoBase.posicion } : undefined}
              className="block aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          </Link>

          <div className="flex flex-col gap-7 lg:col-span-5">
            <div className="flex flex-col gap-2">
              <h2 className="text-[32px] font-medium leading-[1.1] tracking-[-0.02em] lg:text-[38px]">
                {SOPORTE.nombre}
              </h2>
              <p className="text-[17px] leading-[27px] text-pliego-tinta-suave">
                {SOPORTE.bajada}
              </p>
            </div>

            <dl className="flex flex-col gap-4">
              {BENEFICIOS.map((b) => (
                <div
                  key={b.titulo}
                  className="flex flex-col gap-1 border-t border-pliego-linea pt-4"
                >
                  <dt className="text-lg font-medium leading-6">{b.titulo}</dt>
                  <dd className="text-[15px] leading-6 text-pliego-tinta-suave">{b.texto}</dd>
                </div>
              ))}
            </dl>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-[10px] bg-pliego-superficie p-4">
              {DATOS_PORTADA.map((dato) => (
                <PliegoDato key={dato.rotulo} rotulo={dato.rotulo} valor={dato.valor} />
              ))}
            </dl>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <PliegoPrecio item={soporte} className="text-xl leading-7" />
              <Link to={rutaPieza(SOPORTE.slug)} className={botonPrimario}>
                {soporte.estado === "venta" ? "Comprar el Soporte 24" : "Ver el Soporte 24"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Accesorios: dos grandes, tres chicos y el Sistema a lo ancho */}
      <section id="accesorios" className={`${contenedor} ${ancla} py-16 md:py-24`}>
        <div className="mb-10 flex max-w-xl flex-col gap-3">
          <h2 className={tituloSeccion}>Accesorios que encastran</h2>
          <p className="text-pliego-tinta-suave">
            Calzan en cualquier ranura del Soporte 24 y se cambian de lugar sin
            herramientas. Usá los que necesites hoy y sumá otros después.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6 lg:gap-8">
          {accesorios.map((a, i) => (
            <PliegoTarjeta
              key={a.pieza.slug}
              item={a}
              className={cn(
                i < 2 ? "lg:col-span-3" : "lg:col-span-2",
                // En dos columnas, el quinto ocupa la fila entera.
                i === 4 && "sm:col-span-2 lg:col-span-2",
              )}
            />
          ))}

          <Link
            to={rutaPieza(SISTEMA.slug)}
            className="grid gap-8 rounded-[10px] bg-pliego-salvia-suave p-6 sm:col-span-2 md:p-10 lg:col-span-6 lg:grid-cols-12 lg:items-center lg:gap-12"
          >
            <div className="flex flex-col gap-3 lg:col-span-5">
              <p className={`${rotulo} text-pliego-salvia-texto`}>Soporte + 5 accesorios</p>
              <h3 className={tituloSeccion}>{SISTEMA.nombre}</h3>
              <p>
                El Soporte 24 con todos los accesorios, listo para armar tu
                escritorio de una vez.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-2">
                <PliegoPrecio item={sistema} className="text-lg leading-7" />
                <span className="inline-flex items-center gap-2 font-medium text-pliego-salvia-texto">
                  Ver el sistema <PliegoFlecha />
                </span>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 lg:col-span-7 lg:gap-3">
              {accesorios.map((a) => {
                const foto = fotosDe(a)[0];
                return (
                  <img
                    key={a.pieza.slug}
                    src={foto.src}
                    alt=""
                    width={200}
                    height={250}
                    loading="lazy"
                    style={foto.posicion ? { objectPosition: foto.posicion } : undefined}
                    className="block aspect-[4/5] w-full rounded-md bg-pliego-linea object-cover"
                  />
                );
              })}
            </div>
          </Link>
        </div>
      </section>

      {/* Armador: los accesorios puestos en el soporte, en 3D */}
      <section id="armar" className={`${contenedor} ${ancla} py-16 md:py-24`}>
        <PliegoArmador items={items} />
      </section>

      {/* Preguntas frecuentes */}
      <section id="preguntas" className={`${contenedor} ${ancla} py-16 md:py-24`}>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
          <h2 className={`lg:col-span-4 ${tituloSeccion}`}>Preguntas frecuentes</h2>
          <div className="min-w-0 border-t border-pliego-linea lg:col-span-8">
            {preguntas.map((p, i) => (
              <details
                key={p.q}
                open={i === 0}
                className="group border-b border-pliego-linea py-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium leading-7 [&::-webkit-details-marker]:hidden">
                  {p.q}
                  <span
                    aria-hidden="true"
                    className="text-pliego-tinta-suave transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-[65ch] text-pliego-tinta-suave">{p.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Firma: Pliego, de DZ Estudio */}
      <section className={`${contenedor} pb-16 pt-8 md:pb-24`}>
        <div className="flex flex-wrap items-center justify-between gap-x-12 gap-y-6 border-t border-pliego-linea pt-10">
          <div className="flex min-w-0 flex-[999_1_420px] items-start gap-6">
            <img
              src="/pliego/pliego-simbolo.svg"
              alt=""
              width={64}
              height={40}
              className="mt-1 w-14 shrink-0"
            />
            <div className="flex flex-col gap-2">
              <p className="text-xl font-medium leading-7">
                Pliego es la línea de escritorio de DZ Estudio.
              </p>
              <p className="max-w-[60ch] text-pliego-tinta-suave">
                La diseña el mismo estudio de Santa Fe que hace los almohadones e
                individuales. Acá, en acero: piezas simples para que tu lugar de
                trabajo tenga lo justo.
              </p>
            </div>
          </div>
          <Link
            to="/tienda"
            className="inline-flex min-h-11 flex-auto items-center justify-end gap-2 font-medium text-pliego-salvia-texto"
          >
            Ver almohadones e individuales <PliegoFlecha />
          </Link>
        </div>
      </section>
    </div>
  );
}
