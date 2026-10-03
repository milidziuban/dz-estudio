import { useEffect, useState } from "react";
import { useCart } from "../../hooks/useCart";
import { useInstallments } from "../../hooks/useInstallments";
import type { PliegoItem } from "../../hooks/usePliego";
import { useStoreSettings } from "../../hooks/useStoreSettings";
import { trackAddToCart } from "../../lib/analytics";
import { botonPrimario } from "../../lib/pliego-clases";
import { DEFAULT_PROMOS } from "../../lib/promos";
import {
  avisoDeUnidades,
  topeDeCantidad,
  unidadesDisponibles,
} from "../../lib/stock";
import PliegoEspera from "./PliegoEspera";
import PliegoPrecio from "./PliegoPrecio";

type PliegoCompraProps = {
  item: PliegoItem;
};

/** Precio y compra de una pieza. En venta: cantidad y carrito, el mismo
 *  carrito y checkout que los textiles. Si todavía no se vende, o se agotó,
 *  la lista de espera en el mismo lugar donde iba el botón. */
export default function PliegoCompra({ item }: PliegoCompraProps) {
  const { producto, estado, pieza } = item;
  const cuotas = useInstallments();
  const { data: settings } = useStoreSettings();
  const promos = settings?.marketing.promos ?? DEFAULT_PROMOS;
  const addToCart = useCart((s) => s.add);
  const openCart = useCart((s) => s.open);
  const [qty, setQty] = useState(1);

  useEffect(() => setQty(1), [pieza.slug]);

  const condiciones = [
    cuotas.label,
    promos.transferencia.enabled
      ? `${promos.transferencia.percent} % de descuento por transferencia`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const disponibles = producto ? unidadesDisponibles(producto) : null;
  const tope = topeDeCantidad(disponibles);
  const qtyEnRango = Math.min(qty, tope);
  const aviso = estado === "venta" ? avisoDeUnidades(disponibles) : null;

  const agregar = () => {
    if (!producto) return;
    addToCart(producto.slug, undefined, qtyEnRango, tope);
    trackAddToCart(producto, undefined, qtyEnRango);
    openCart();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <PliegoPrecio item={item} className="text-2xl leading-8" />
        {producto && (
          <p className="text-sm leading-5 text-pliego-tinta-suave">{condiciones}</p>
        )}
      </div>

      {estado === "venta" ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            <div className="flex h-12 items-center rounded-sm border border-pliego-piedra">
              <button
                type="button"
                aria-label="Restar una unidad"
                disabled={qtyEnRango <= 1}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="h-full px-4 text-lg disabled:cursor-not-allowed disabled:text-pliego-linea"
              >
                −
              </button>
              <span
                className="min-w-8 text-center font-pliego-mono text-sm"
                aria-live="polite"
              >
                {qtyEnRango}
              </span>
              <button
                type="button"
                aria-label="Sumar una unidad"
                disabled={qtyEnRango >= tope}
                onClick={() => setQty((q) => Math.min(q + 1, tope))}
                className="h-full px-4 text-lg disabled:cursor-not-allowed disabled:text-pliego-linea"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={agregar}
              className={`${botonPrimario} min-w-[11rem] flex-1`}
            >
              Agregar al carrito
            </button>
          </div>
          {aviso && (
            <p className="font-pliego-mono text-[13px] leading-5 text-pliego-salvia-texto">
              {aviso}
            </p>
          )}
        </div>
      ) : estado === "agotada" ? (
        <PliegoEspera
          titulo="Avisame cuando vuelva"
          texto="Se agotó esta tanda. Te escribimos cuando haya unidades de nuevo."
        />
      ) : (
        <PliegoEspera
          titulo="Avisame cuando salga"
          texto="Te escribimos una sola vez, cuando salgan las primeras unidades."
        />
      )}
    </div>
  );
}
