import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { PLIEGO_FUENTES, PLIEGO_PATH } from "../../lib/pliego";

/** Entrada a Pliego desde la home, debajo de Categorías. El rótulo es de DZ
 *  (es la home de la tienda); la tarjeta ya es Pliego: su paleta, su
 *  tipografía y su logo, como la puerta de una tienda dentro de la tienda. */
export default function PliegoBloque() {
  return (
    <section className="px-5 pb-16 sm:px-8 md:pb-24 lg:px-12">
      <Helmet>
        <link rel="stylesheet" href={PLIEGO_FUENTES} />
      </Helmet>
      <div className="mx-auto max-w-6xl">
        <p className="mb-6 font-mono text-xs font-medium uppercase tracking-widest">
          ✧ Nueva línea
        </p>

        <Link
          to={PLIEGO_PATH}
          className="group grid overflow-hidden rounded-2xl border border-pliego-linea bg-pliego-fondo font-pliego text-pliego-tinta md:grid-cols-2"
        >
          <div className="overflow-hidden">
            <img
              src="/pliego/soporte-24-escritorio.webp"
              alt="Soporte 24 en un escritorio con sus accesorios"
              width={1379}
              height={649}
              loading="lazy"
              className="h-60 w-full object-cover object-[42%_50%] transition-transform duration-500 group-hover:scale-[1.03] md:h-full"
            />
          </div>
          <div className="flex flex-col justify-center gap-6 p-7 md:p-14">
            <div className="flex flex-col gap-2.5">
              <img
                src="/pliego/pliego-firma.svg"
                alt="Pliego"
                width={228}
                height={56}
                className="h-11 w-auto self-start"
              />
              <span className="text-[13px] leading-5 text-pliego-tinta-suave">
                de DZ Estudio
              </span>
            </div>
            <p className="text-2xl font-medium leading-tight md:text-[28px] md:leading-[34px]">
              Tu escritorio, más claro.
            </p>
            <p className="text-pliego-tinta-suave">
              Una sola pieza de acero que levanta el monitor, con accesorios que
              encastran en sus ranuras.
            </p>
            <span className="inline-flex min-h-12 items-center self-start rounded-sm bg-pliego-salvia px-6 text-[15px] font-medium transition-colors group-hover:bg-[#8FA590]">
              Conocer Pliego
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}
