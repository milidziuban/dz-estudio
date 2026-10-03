import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";
import { PLIEGO_PATH } from "../../lib/pliego";

type PliegoLinkMenuProps = {
  /** La versión pastilla de la fila de categorías en mobile */
  mobile?: boolean;
};

/** Pliego va en el menú con su logotipo y no con texto en DM Mono: es otra
 *  marca dentro de la tienda, y su P de hombros redondeados no se escribe con
 *  ninguna fuente (regla del sistema de marca de Pliego). */
export default function PliegoLinkMenu({ mobile = false }: PliegoLinkMenuProps) {
  return (
    <Link
      to={PLIEGO_PATH}
      aria-label="Pliego, la línea de escritorio"
      className={cn(
        "flex shrink-0 items-center transition-opacity hover:opacity-70",
        mobile && "rounded-full border border-ink/25 px-3.5 py-1.5 hover:border-ink",
      )}
    >
      <img
        src="/pliego/pliego-logotipo.svg"
        alt=""
        width={138}
        height={52}
        className={mobile ? "h-4 w-auto translate-y-[2px]" : "h-[18px] w-auto translate-y-[2px]"}
      />
    </Link>
  );
}

