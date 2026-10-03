import { Link } from "react-router-dom";
import { fotosDe, type PliegoItem } from "../../hooks/usePliego";
import { rutaPieza } from "../../lib/pliego";
import PliegoFlecha from "./PliegoFlecha";
import PliegoPrecio from "./PliegoPrecio";

type PliegoTarjetaProps = {
  item: PliegoItem;
};

/** Una pieza en la grilla: foto, nombre, para qué sirve y precio. Toda la
 *  tarjeta lleva a su ficha. */
export default function PliegoTarjeta({ item }: PliegoTarjetaProps) {
  const { pieza } = item;
  const foto = fotosDe(item)[0];

  return (
    <Link
      to={rutaPieza(pieza.slug)}
      className="group flex flex-col overflow-hidden rounded-[10px] border border-pliego-linea bg-pliego-superficie transition-colors hover:border-pliego-piedra"
    >
      <div className="overflow-hidden bg-pliego-linea">
        <img
          src={foto.src}
          alt={foto.alt}
          width={620}
          height={310}
          loading="lazy"
          style={foto.posicion ? { objectPosition: foto.posicion } : undefined}
          className="block aspect-[2/1] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-xl font-medium leading-7">{pieza.nombre}</h3>
          <PliegoPrecio item={item} className="shrink-0 text-sm leading-5" />
        </div>
        <p className="text-pliego-tinta-suave">{pieza.bajada}</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-2 text-[15px] font-medium text-pliego-salvia-texto">
          Ver {pieza.tipo === "accesorio" ? "accesorio" : "detalle"}
          <PliegoFlecha />
        </span>
      </div>
    </Link>
  );
}
