import type { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import PliegoArmador from "../components/pliego/PliegoArmador";
import PliegoCheck from "../components/pliego/PliegoCheck";
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

const BENEFICIOS: { titulo: string; texto: string; icono: ReactNode }[] = [
  {
    titulo: "Libera la mesa",
    texto:
      "Debajo quedan unos 90 mm libres. Al terminar el día, el teclado entra ahí y el escritorio queda despejado.",
    icono: (
      <>
        <path d="M8 30H4V16A6 6 0 0 1 10 10H30A6 6 0 0 1 36 16V30H32" />
        <path d="M10 30H30" strokeDasharray="3 3" />
      </>
    ),
  },
  {
    titulo: "Una sola pieza",
    texto:
      "Chapa de acero de 1,5 mm cortada y plegada. Sin tornillos ni soldaduras: no hay nada que se afloje con el tiempo.",
    icono: (
      <>
        <path d="M6 28L14 12H34L26 28Z" />
        <path d="M14 12V6" />
        <path d="M34 12V6" />
      </>
    ),
  },
  {
    titulo: "Se arma a tu manera",
    texto:
      "Doce ranuras: seis adelante para lo que usás todo el día y seis atrás para llevar los cables. Cada accesorio va donde lo necesitás.",
    icono: (
      <>
        <rect x="4" y="12" width="32" height="16" rx="2" />
        <path d="M9 20H15" />
        <path d="M17 20H23" />
        <path d="M25 20H31" />
      </>
    ),
  },
];

const PASOS = [
  {
    titulo: "Elegí una ranura",
    texto: "Adelante, lo que usás todo el día. Atrás, los cables.",
  },
  {
    titulo: "Calzá el accesorio",
    texto: "La lengüeta entra en la ranura y el accesorio queda firme, sin tornillos.",
  },
  {
    titulo: "Movelo cuando quieras",
    texto: "Se levanta y se pasa a otra ranura. El escritorio cambia con tu día.",
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
  const fotoSoporte = fotosDe(soporte)[0];
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

      {/* Portada */}
      <section className={`${contenedor} pb-12 pt-10 md:pb-16 md:pt-14`}>
        <div className="grid items-end gap-8 md:grid-cols-2 md:gap-14">
          <div className="flex flex-col gap-4">
            <p className={`${rotulo} flex flex-wrap items-center gap-3 text-pliego-tinta-suave`}>
              Soporte 24 · Acero plegado
              {enEspera && (
                <span className="rounded-sm bg-pliego-salvia-suave px-2 py-1 text-pliego-salvia-texto">
                  Próximamente
                </span>
              )}
            </p>
            <h1 className="text-[40px] font-medium leading-[1.08] tracking-[-0.015em] lg:text-[60px]">
              Tu escritorio, más claro.
            </h1>
          </div>
          <div className="flex flex-col gap-6">
            <p className="text-lg leading-[29px]">
              Una sola pieza de acero que levanta el monitor y libera la mesa.
              Los accesorios encastran en sus ranuras y se cambian en segundos.
              Sin tornillos.
            </p>
            {/* Antes del lanzamiento lo que se puede hacer acá es anotarse:
                el botón de compra recién aparece al final de la ficha. */}
            {enEspera ? (
              <div className="flex flex-col gap-1">
                <PliegoEspera
                  compacta
                  texto="Todavía no está a la venta. Dejá tu mail y te avisamos cuando salgan las primeras unidades."
                />
                <div className="flex flex-wrap gap-x-6">
                  <Link
                    to={rutaPieza(SOPORTE.slug)}
                    className="inline-flex min-h-11 items-center text-[15px] font-medium underline underline-offset-4"
                  >
                    Ver el Soporte 24
                  </Link>
                  <a
                    href="#accesorios"
                    className="inline-flex min-h-11 items-center text-[15px] font-medium underline underline-offset-4"
                  >
                    Ver accesorios
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link to={rutaPieza(SOPORTE.slug)} className={botonPrimario}>
                  {soporte.estado === "venta"
                    ? "Comprar el Soporte 24"
                    : "Ver el Soporte 24"}
                </Link>
                <a
                  href="#accesorios"
                  className="inline-flex min-h-12 items-center text-[15px] font-medium underline underline-offset-4"
                >
                  Ver accesorios
                </a>
              </div>
            )}
          </div>
        </div>

        <img
          src="/pliego/soporte-24-escritorio.webp"
          alt="Soporte 24 en un escritorio, con el monitor encima, el celular, la bandeja y los auriculares colgados de sus ranuras"
          width={1379}
          height={649}
          fetchpriority="high"
          className="mt-10 block aspect-[2.12/1] w-full rounded-[10px] bg-pliego-linea object-cover md:mt-12"
        />

        <dl className="grid gap-x-6 gap-y-4 pt-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {DATOS_PORTADA.map((dato) => (
            <PliegoDato
              key={dato.rotulo}
              rotulo={dato.rotulo}
              valor={dato.valor}
              className="border-t border-pliego-linea pt-3"
            />
          ))}
        </dl>
      </section>

      {/* Beneficios */}
      <section className={`${contenedor} py-16 md:py-24`}>
        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {BENEFICIOS.map((b) => (
            <div key={b.titulo} className="flex flex-col gap-3">
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                {b.icono}
              </svg>
              <h2 className="text-xl font-medium leading-7">{b.titulo}</h2>
              <p className="text-pliego-tinta-suave">{b.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* La base: el Soporte 24 */}
      <section id="soporte" className={`${contenedor} ${ancla} py-16 md:py-24`}>
        <div className="grid overflow-hidden rounded-[10px] border border-pliego-linea bg-pliego-superficie md:grid-cols-[3fr_2fr]">
          <Link to={rutaPieza(SOPORTE.slug)} className="group overflow-hidden bg-pliego-linea">
            <img
              src={fotoSoporte.src}
              alt={fotoSoporte.alt}
              width={1379}
              height={649}
              loading="lazy"
              style={
                fotoSoporte.posicion
                  ? { objectPosition: fotoSoporte.posicion }
                  : undefined
              }
              className="block aspect-[3/2] h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] md:aspect-auto"
            />
          </Link>
          <div className="flex flex-col gap-6 p-6 md:p-10">
            <div className="flex flex-col gap-2">
              <p className={`${rotulo} text-pliego-tinta-suave`}>La base</p>
              <h2 className={tituloSeccion}>
                <Link to={rutaPieza(SOPORTE.slug)} className="hover:underline">
                  {SOPORTE.nombre}
                </Link>
              </h2>
              <p className="text-pliego-tinta-suave">{SOPORTE.bajada}</p>
            </div>
            <ul className="flex flex-col gap-2.5">
              {SOPORTE.usos.map((uso) => (
                <li key={uso} className="flex items-start gap-2.5">
                  <span className="mt-1">
                    <PliegoCheck />
                  </span>
                  {uso}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-col gap-4 border-t border-pliego-linea pt-5">
              <PliegoPrecio item={soporte} className="text-xl leading-7" />
              <Link to={rutaPieza(SOPORTE.slug)} className={`${botonPrimario} self-start`}>
                {soporte.estado === "venta" ? "Comprar el Soporte 24" : "Ver el Soporte 24"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Accesorios */}
      <section id="accesorios" className={`${contenedor} ${ancla} py-16 md:py-24`}>
        <div className="mb-8 flex max-w-xl flex-col gap-2">
          <h2 className={tituloSeccion}>Accesorios que encastran</h2>
          <p className="text-pliego-tinta-suave">
            Calzan en cualquier ranura del Soporte 24 y se cambian de lugar sin
            herramientas. Usá los que necesites hoy y sumá otros después.
          </p>
          <a
            href="#armar"
            className="inline-flex min-h-11 items-center gap-2 self-start font-medium text-pliego-salvia-texto"
          >
            Probalos en el soporte, en 3D <PliegoFlecha />
          </a>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {accesorios.map((a) => (
            <PliegoTarjeta key={a.pieza.slug} item={a} />
          ))}

          <Link
            to={rutaPieza(SISTEMA.slug)}
            className="flex min-h-[260px] flex-col justify-between gap-6 rounded-[10px] bg-pliego-salvia-suave p-7"
          >
            <div className="flex flex-col gap-2">
              <p className={`${rotulo} text-pliego-salvia-texto`}>
                Soporte + 5 accesorios
              </p>
              <h3 className={tituloSeccion}>{SISTEMA.nombre}</h3>
              <p>
                El Soporte 24 con todos los accesorios, listo para armar tu
                escritorio de una vez.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <PliegoPrecio item={sistema} className="text-lg leading-7" />
              <span className="inline-flex items-center gap-2 font-medium text-pliego-salvia-texto">
                Ver el sistema <PliegoFlecha />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Cómo encastra: va antes del armador, que es donde se prueba */}
      <section className={`${contenedor} py-16 md:py-24`}>
        <h2 className={`mb-8 ${tituloSeccion}`}>Cambiás el escritorio en segundos</h2>
        <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
          {PASOS.map((paso, i) => (
            <li
              key={paso.titulo}
              className="flex flex-col gap-2 border-t border-pliego-tinta pt-4"
            >
              <span className="font-pliego-mono text-[13px] leading-5 text-pliego-tinta-suave">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-xl font-medium leading-7">{paso.titulo}</h3>
              <p className="text-pliego-tinta-suave">{paso.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Armador: los accesorios puestos en el soporte, en 3D */}
      <section id="armar" className={`${contenedor} ${ancla} py-16 md:py-24`}>
        <PliegoArmador items={items} />
      </section>

      {/* Preguntas frecuentes */}
      <section id="preguntas" className={`${contenedor} ${ancla} py-16 md:py-24`}>
        <div className="flex flex-wrap gap-x-16 gap-y-6">
          <h2 className={`flex-[1_1_280px] ${tituloSeccion}`}>Preguntas frecuentes</h2>
          <div className="min-w-0 flex-[999_1_560px] border-t border-pliego-linea">
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
                <p className="mt-3 text-pliego-tinta-suave">{p.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Firma: Pliego, de DZ Estudio */}
      <section className={`${contenedor} py-16 md:py-24`}>
        <div className="flex flex-wrap items-center justify-between gap-x-12 gap-y-6 rounded-[10px] border border-pliego-linea bg-pliego-superficie p-7 md:p-14">
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
              <p className="text-pliego-tinta-suave">
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
