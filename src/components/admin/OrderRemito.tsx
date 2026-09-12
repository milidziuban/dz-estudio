import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  SETTINGS_DEFAULTS,
  useStoreSettings,
} from "../../hooks/useStoreSettings";
import {
  ORDER_STATUS_LABEL,
  PAYMENT_LABEL,
  SHIPPING_METHOD_LABEL,
  SHIPPING_STATUS_LABEL,
  cuponLabel,
  envioPorCobrar,
  formatDateTime,
  orderRevenue,
} from "../../lib/admin";
import { cn } from "../../lib/cn";
import { formatPrice } from "../../lib/format";
import { SITE } from "../../lib/site";
import type { Order } from "../../types/admin";
import Button from "../Button";

type OrderRemitoProps = {
  /** La orden que se va a despachar. null = no hay remito abierto. */
  order: Order | null;
  onClose: () => void;
};

const ETIQUETA = "font-mono text-[9px] uppercase tracking-[0.18em] text-ink/65";

/**
 * Remito de una orden, listo para imprimir en A4.
 *
 * En pantalla es una hoja blanca sobre el panel, para revisarla antes de
 * mandarla a la impresora. Al imprimir, la hoja es lo único que queda: el
 * bloque `@media print` de globals.css apaga `#root` entero —el remito se
 * monta por portal, fuera de él— y se lleva de paso el sidebar, el drawer y
 * el fondo cream, que en papel solo gasta tinta.
 */
export default function OrderRemito({ order, onClose }: OrderRemitoProps) {
  const settings = useStoreSettings();

  useEffect(() => {
    if (!order) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // El drawer desde el que se abre este remito ya bloqueó el scroll:
    // guardamos lo que había para devolverlo tal cual y no destrabar el fondo.
    const scrollPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = scrollPrevio;
    };
  }, [order, onClose]);

  if (!order) return null;

  const distribucion =
    settings.data?.distribucion ?? SETTINGS_DEFAULTS.distribucion;
  const puntoRetiro = distribucion.locations.find((location) => location.retiro);

  // Las órdenes de retiro se guardan sin dirección: el checkout no se la pide
  // a nadie que pase por el depósito. Acá se dice con todas las letras, en vez
  // de imprimir un bloque vacío que parezca un dato que se perdió.
  const retira = order.shippingMethod === "retiro";
  // El envío a coordinar no se cobró en la tienda. En la hoja con la que se
  // despacha, "Sin cargo" sería exactamente el error que hace despachar gratis.
  // Salvo que la clienta haya usado un cupón de envío gratis: ahí sí va sin
  // cargo, y la hoja lo dice con el código para que no se cobre por error.
  const envioSinCobrar = envioPorCobrar(order);
  const envioGratisPorCupon = order.couponKind === "free-shipping";
  const direccion = order.shippingAddress;
  const hayDireccion = Boolean(direccion?.direccion);

  const numero = order.id.slice(0, 8).toUpperCase();

  return createPortal(
    <div
      className="remito-overlay fixed inset-0 z-[60] overflow-y-auto bg-ink/50 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`Remito de la orden ${numero}`}
    >
      <div className="remito-no-print mx-auto mb-4 flex max-w-[820px] flex-wrap justify-end gap-3">
        <Button className="px-6" onClick={() => window.print()}>
          Imprimir ✦
        </Button>
        <Button variant="secondary" className="bg-cream px-6" onClick={onClose}>
          Cerrar
        </Button>
      </div>

      <div className="remito-hoja mx-auto max-w-[820px] rounded-2xl bg-white p-10 text-ink sm:p-12">
        {/* Marca chica y arriba: es todo lo que la hoja necesita para que se
            sepa de dónde salió el paquete. */}
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/20 pb-5">
          <div>
            <img
              src="/logo-extendido.svg"
              alt={SITE.name}
              className="h-5 w-auto"
            />
            <p className="mt-2 font-mono text-[10px] leading-relaxed text-ink/65">
              {SITE.email} · {SITE.whatsapp}
              <br />
              {SITE.url.replace("https://", "")} · CUIT {SITE.cuit}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-medium uppercase tracking-[0.18em]">
              Remito
            </p>
            <p className="mt-1 font-mono text-lg font-medium">{numero}</p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-ink/15 py-5 sm:grid-cols-3">
          <div>
            <p className={ETIQUETA}>Fecha del pedido</p>
            <p className="mt-1 text-sm">{formatDateTime(order.createdAt)}</p>
          </div>
          <div>
            <p className={ETIQUETA}>Estado del pago</p>
            <p className="mt-1 text-sm">
              {ORDER_STATUS_LABEL[order.status]} ·{" "}
              {PAYMENT_LABEL[order.paymentMethod]}
            </p>
          </div>
          <div>
            <p className={ETIQUETA}>Estado del envío</p>
            <p className="mt-1 text-sm">
              {SHIPPING_STATUS_LABEL[order.shippingStatus]}
            </p>
          </div>
        </section>

        <section className="grid gap-6 border-b border-ink/15 py-5 sm:grid-cols-2">
          <div>
            <p className={ETIQUETA}>Cliente</p>
            <p className="mt-1 text-sm font-semibold">{order.customerName}</p>
            <p className="text-sm leading-relaxed">
              {order.customerPhone ?? "Sin teléfono"}
              <br />
              {order.customerEmail}
            </p>
          </div>

          <div>
            <p className={ETIQUETA}>Envío</p>
            <p className="mt-1 text-sm font-semibold">
              {SHIPPING_METHOD_LABEL[order.shippingMethod] ??
                order.shippingMethod}
            </p>
            {retira ? (
              <p className="text-sm leading-relaxed">
                Retira en el depósito.
                <br />
                {puntoRetiro?.direccion ?? SITE.retiro.direccion}
                <br />
                {puntoRetiro?.horario ?? SITE.retiro.horario}
              </p>
            ) : hayDireccion ? (
              <p className="text-sm leading-relaxed">
                {direccion.direccion}
                <br />
                {direccion.ciudad}, {direccion.provincia}
                <br />
                CP {direccion.cp}
              </p>
            ) : (
              <p className="text-sm leading-relaxed">
                Esta orden no tiene dirección cargada. Pedila antes de
                despachar.
              </p>
            )}
            {order.trackingCode && (
              <p className="mt-2 font-mono text-[11px]">
                Seguimiento: {order.trackingCode}
              </p>
            )}
          </div>
        </section>

        <section className="py-5">
          <p className={ETIQUETA}>Lo que va en el paquete</p>
          <table className="mt-3 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/20 text-left">
                <th className={cn(ETIQUETA, "py-2 font-normal")}>Producto</th>
                <th className={cn(ETIQUETA, "py-2 text-center font-normal")}>
                  Cant.
                </th>
                <th className={cn(ETIQUETA, "py-2 text-right font-normal")}>
                  Unitario
                </th>
                <th className={cn(ETIQUETA, "py-2 text-right font-normal")}>
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr
                  key={`${item.slug}-${item.variant_id ?? index}`}
                  className="border-b border-ink/10 align-top"
                >
                  <td className="py-2.5 pr-3">
                    {item.name}
                    {item.variant && (
                      <span className="text-ink/65"> · {item.variant}</span>
                    )}
                  </td>
                  <td className="py-2.5 text-center font-mono text-xs">
                    {item.qty}
                  </td>
                  <td className="py-2.5 text-right font-mono text-xs">
                    {formatPrice(item.price)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-xs">
                    {formatPrice(item.price * item.qty)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="ml-auto mt-4 w-full max-w-xs space-y-1.5 font-mono text-xs">
            <div className="flex justify-between">
              <dt className="text-ink/65">Productos</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink/65">
                  {order.discountLabel ?? "Descuento"}
                </dt>
                <dd>−{formatPrice(order.discount)}</dd>
              </div>
            )}
            {envioGratisPorCupon && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink/65">{cuponLabel(order)}</dt>
                <dd>✦</dd>
              </div>
            )}
            {/* El envío va aparte de punta a punta: es plata que pasa de largo
                hacia la transportista y nunca cuenta como facturación. La
                línea de lo facturado solo aparece cuando hay envío que
                descontar; si no, repetiría el total. */}
            {order.shippingCost > 0 && (
              <div className="flex justify-between border-t border-ink/15 pt-1.5">
                <dt className="text-ink/65">Facturado (sin envío)</dt>
                <dd>{formatPrice(orderRevenue(order))}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink/65">Envío</dt>
              <dd className={envioSinCobrar ? "font-medium" : undefined}>
                {envioSinCobrar
                  ? "A cobrar"
                  : order.shippingCost
                    ? formatPrice(order.shippingCost)
                    : envioGratisPorCupon
                      ? "Sin cargo · cupón"
                      : "Sin cargo"}
              </dd>
            </div>
            <div className="flex justify-between border-t border-ink/20 pt-1.5 text-sm font-medium">
              <dt>{envioSinCobrar ? "Cobrado" : "Total"}</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
          {envioSinCobrar && (
            <p className="mt-2 border border-ink px-2 py-1.5 text-[11px] font-medium">
              ✦ Falta cobrar el envío. Este total es solo de los productos.
            </p>
          )}
          {envioGratisPorCupon && (
            <p className="mt-2 border border-ink px-2 py-1.5 text-[11px] font-medium">
              ✦ Envío sin cargo por el cupón {order.couponCode}. No se cobra
              aparte.
            </p>
          )}
        </section>

        {order.customerNotes && (
          <section className="border-t border-ink/15 py-5">
            <p className={ETIQUETA}>Nota del cliente</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
              {order.customerNotes}
            </p>
          </section>
        )}

        <footer className="border-t border-ink/20 pt-4 text-[11px] leading-relaxed text-ink/65">
          <p>Cambios y consultas: {SITE.email}.</p>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em]">
            Impreso el {formatDateTime(new Date().toISOString())}
          </p>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
