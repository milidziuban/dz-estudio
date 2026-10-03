import type { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import PliegoDato from "../components/pliego/PliegoDato";
import PliegoEspera from "../components/pliego/PliegoEspera";
import PliegoPlano from "../components/pliego/PliegoPlano";
import Seo from "../components/Seo";
import { useEnvioNacional } from "../hooks/useEnvioNacional";
import { useInstallments } from "../hooks/useInstallments";
import { useStoreSettings } from "../hooks/useStoreSettings";
import { envioFraseCorta } from "../lib/envio-texto";
import {
  ACCESORIOS,
  DATOS_PORTADA,
  PLIEGO_CARGA_KG,
  PLIEGO_ETAPA,
  PLIEGO_FUENTES,
  PLIEGO_SLUGS,
  SISTEMA_COMPLETO,
  datosMedidas,
} from "../lib/pliego";
import { DEFAULT_PROMOS } from "../lib/promos";
import { SITE } from "../lib/site";

/* Pliego vive dentro de la tienda, pero adentro de esta página todo es
 * Pliego: fondo hueso, antracita, salvia como único acento (los botones),
 * Manrope para leer e IBM Plex Mono solo para medidas. Esquinas R10 en
 * tarjetas y fotos, R2 en botones, como los plegados del soporte. */

const contenedor = "mx-auto max-w-6xl px-5 sm:px-8 lg:px-12";
const rotulo =
  "font-pliego-mono text-[11px] font-medium uppercase leading-4 tracking-[0.08em]";
const botonPrimario =
  "inline-flex min-h-12 items-center justify-center rounded-sm bg-pliego-salvia px-6 text-[15px] font-medium text-pliego-tinta transition-colors hover:bg-[#8FA590]";

function Check() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M5 12L10 17L19 7" />
    </svg>
  );
}

function Flecha() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
    >
      <path d="M5 12H19" />
      <path d="M13 6L19 12L13 18" />
    </svg>
  );
}

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
  const transferencia = promos.transferencia.enabled
    ? `${promos.transferencia.percent} % de descuento por transferencia`
    : null;

  const enVenta = PLIEGO_ETAPA === "venta";
  const fichaSoporte = `/producto/${PLIEGO_SLUGS.soporte}`;
  const fichaSistema = `/producto/${PLIEGO_SLUGS.sistema}`;

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
      q: "¿Cómo se limpia?",
      a: "Con un paño húmedo, sin productos abrasivos. El panel de flujo se borra en seco, con un paño o un borrador.",
    },
    {
      q: "¿Puedo comprar los accesorios sueltos?",
      a: "Sí. Empezá con el soporte y sumá accesorios cuando los necesites. Si los querés todos, el Sistema completo sale menos.",
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
    <div className="bg-pliego-fondo pb-4 font-pliego text-base leading-[26px] text-pliego-tinta">
      <Seo
        title="Pliego, objetos de escritorio"
        description="Pliego, de DZ Estudio: un soporte de monitor de una sola pieza de acero, con accesorios que encastran en sus ranuras."
        image={`${SITE.url}/pliego/og-pliego.jpg`}
        path="/pliego"
      />
      <Helmet>
        <link rel="stylesheet" href={PLIEGO_FUENTES} />
      </Helmet>

      {/* Subbarra: la firma de Pliego y sus secciones */}
      <div className="border-b border-pliego-linea bg-pliego-superficie">
        <div
          className={`${contenedor} flex flex-wrap items-center justify-between gap-x-8 gap-y-1 py-3`}
        >
          <div className="flex items-center gap-4">
            <img
              src="/pliego/pliego-firma.svg"
              alt="Pliego"
              width={228}
              height={56}
              className="h-8 w-auto"
            />
            <span className="text-[13px] leading-5 text-pliego-tinta-suave">
              de DZ Estudio
            </span>
          </div>
          <nav
            aria-label="Secciones de Pliego"
            className="flex flex-wrap gap-x-6 text-sm"
          >
            <a href="#accesorios" className="py-2.5 hover:text-pliego-salvia-texto">
              Accesorios
            </a>
            <a href="#medidas" className="py-2.5 hover:text-pliego-salvia-texto">
              Medidas
            </a>
            <a href="#sistema" className="py-2.5 hover:text-pliego-salvia-texto">
              Sistema completo
            </a>
            <a href="#preguntas" className="py-2.5 hover:text-pliego-salvia-texto">
              Preguntas
            </a>
          </nav>
        </div>
      </div>

      {/* Portada */}
      <section className={`${contenedor} pt-12 md:pt-16`}>
        <div className="grid items-end gap-x-16 gap-y-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <p className={`${rotulo} text-pliego-tinta-suave`}>
              Soporte 24 · Acero plegado
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
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {enVenta ? (
                <Link to={fichaSoporte} className={botonPrimario}>
                  Comprar el Soporte 24
                </Link>
              ) : (
                <a href="#sistema" className={botonPrimario}>
                  Sumarme a la lista de espera
                </a>
              )}
              <a
                href="#medidas"
                className="inline-flex min-h-12 items-center text-[15px] font-medium underline underline-offset-4"
              >
                Ver medidas
              </a>
            </div>
          </div>
        </div>

        <img
          src="/pliego/soporte-24-escritorio.webp"
          alt="Soporte 24 en un escritorio, con el monitor encima, el celular, la bandeja y los auriculares colgados de sus ranuras"
          width={1379}
          height={649}
          fetchPriority="high"
          className="mt-10 block aspect-[2.12/1] w-full rounded-[10px] bg-pliego-linea object-cover md:mt-12"
        />

        <dl className="grid gap-x-6 gap-y-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
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
      <section className={`${contenedor} pt-20 md:pt-28`}>
        <div className="grid gap-x-12 gap-y-10 md:grid-cols-3">
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

      {/* Accesorios */}
      <section id="accesorios" className={`${contenedor} scroll-mt-28 pt-20 md:pt-28`}>
        <div className="mb-8 flex max-w-xl flex-col gap-2">
          <h2 className="text-[28px] font-medium leading-[34px]">
            Accesorios que encastran
          </h2>
          <p className="text-pliego-tinta-suave">
            Calzan en cualquier ranura del soporte y se cambian de lugar sin
            herramientas. Usá los que necesites hoy y sumá otros después.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ACCESORIOS.map((a) => (
            <article
              key={a.nombre}
              className="flex flex-col overflow-hidden rounded-[10px] border border-pliego-linea bg-pliego-superficie"
            >
              <img
                src={a.imagen}
                alt={a.alt}
                width={620}
                height={310}
                loading="lazy"
                className="block aspect-[2/1] w-full bg-pliego-linea object-cover"
              />
              <div className="flex flex-col gap-2 p-5">
                <h3 className="text-xl font-medium leading-7">{a.nombre}</h3>
                <p className="text-pliego-tinta-suave">{a.texto}</p>
                <p className="mt-1 font-pliego-mono text-[13px] leading-5 text-pliego-tinta-suave">
                  {a.dato}
                </p>
              </div>
            </article>
          ))}

          <a
            href="#sistema"
            className="flex min-h-[260px] flex-col justify-between gap-6 rounded-[10px] bg-pliego-salvia-suave p-7"
          >
            <div className="flex flex-col gap-2">
              <p className={`${rotulo} text-pliego-salvia-texto`}>
                Soporte + 5 accesorios
              </p>
              <h3 className="text-[28px] font-medium leading-[34px]">
                Sistema completo
              </h3>
              <p>
                El Soporte 24 con todos los accesorios, listo para armar tu
                escritorio de una vez.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 font-medium text-pliego-salvia-texto">
              Ver el sistema <Flecha />
            </span>
          </a>
        </div>
      </section>

      {/* Cómo encastra */}
      <section className={`${contenedor} pt-20 md:pt-28`}>
        <h2 className="mb-8 text-[28px] font-medium leading-[34px]">
          Cambiás el escritorio en segundos
        </h2>
        <ol className="grid gap-x-12 gap-y-8 md:grid-cols-3">
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

      {/* Medidas */}
      <section id="medidas" className={`${contenedor} scroll-mt-28 pt-20 md:pt-28`}>
        <div className="flex flex-wrap gap-x-14 gap-y-10 rounded-[10px] border border-pliego-linea bg-pliego-superficie p-6 md:p-12">
          <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h2 className="text-[28px] font-medium leading-[34px]">Medidas</h2>
              <p className="text-pliego-tinta-suave">
                Antes de comprar, medí la base de tu monitor: tiene que entrar
                en la superficie del soporte.
              </p>
            </div>
            <PliegoPlano />
          </div>
          <dl className="flex flex-[1_1_280px] flex-col">
            {datosMedidas().map((dato, i, todos) => (
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
        </div>
      </section>

      {/* Sistema completo + lista de espera o compra */}
      <section id="sistema" className={`${contenedor} scroll-mt-28 pt-20 md:pt-28`}>
        <div className="flex flex-wrap gap-6">
          <div className="flex min-w-0 flex-[999_1_480px] flex-col gap-6 rounded-[10px] bg-pliego-salvia-suave p-6 md:p-12">
            <div className="flex flex-col gap-2">
              <p className={`${rotulo} text-pliego-salvia-texto`}>Sistema completo</p>
              <h2 className="text-[28px] font-medium leading-[34px]">
                Todo el escritorio, de una vez
              </h2>
              <p>El Soporte 24 con sus cinco accesorios, en una sola caja.</p>
            </div>
            <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {SISTEMA_COMPLETO.map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <Check />
                  {item}
                </li>
              ))}
            </ul>
            {enVenta && (
              <Link
                to={fichaSistema}
                className="inline-flex items-center gap-2 self-start border-t border-pliego-salvia pt-5 font-medium text-pliego-salvia-texto"
              >
                Ver precio del Sistema completo <Flecha />
              </Link>
            )}
          </div>

          <div className="flex flex-[1_1_340px] flex-col justify-center rounded-[10px] border border-pliego-linea bg-pliego-superficie p-6 md:p-10">
            {enVenta ? (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-medium leading-7">Retiro y envío</h2>
                  <p className="text-pliego-tinta-suave">
                    Retiro gratis en Guadalupe, Santa Fe Capital.{" "}
                    {envioFraseCorta(envio)}.
                  </p>
                  <p className="text-pliego-tinta-suave">
                    {transferencia ? `${transferencia}, o ` : ""}
                    {cuotas.label.toLowerCase()}.
                  </p>
                </div>
                <Link to={fichaSistema} className={botonPrimario}>
                  Comprar el Sistema completo
                </Link>
                <Link
                  to={fichaSoporte}
                  className="text-[15px] font-medium text-pliego-salvia-texto underline underline-offset-4"
                >
                  Prefiero empezar por el soporte
                </Link>
              </div>
            ) : (
              <PliegoEspera />
            )}
          </div>
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section id="preguntas" className={`${contenedor} scroll-mt-28 pt-20 md:pt-28`}>
        <div className="flex flex-wrap gap-x-16 gap-y-6">
          <h2 className="flex-[1_1_280px] text-[28px] font-medium leading-[34px]">
            Preguntas frecuentes
          </h2>
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
      <section className={`${contenedor} pb-24 pt-20 md:pb-28 md:pt-28`}>
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
            Ver almohadones e individuales <Flecha />
          </Link>
        </div>
      </section>
    </div>
  );
}
