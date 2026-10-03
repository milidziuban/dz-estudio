import type { PliegoItem } from "../../hooks/usePliego";
import { cn } from "../../lib/cn";
import { formatPrice } from "../../lib/format";

type PliegoPrecioProps = {
  item: PliegoItem;
  className?: string;
};

/** El precio de una pieza, del panel. Sin cargar todavía: "Próximamente",
 *  nunca un número inventado. */
export default function PliegoPrecio({ item, className }: PliegoPrecioProps) {
  const { producto, estado } = item;
  return (
    <p className={cn("font-pliego-mono", className)}>
      {producto ? formatPrice(producto.price) : "Próximamente"}
      {estado === "agotada" && (
        <span className="text-pliego-tinta-suave"> · Sin stock</span>
      )}
    </p>
  );
}
