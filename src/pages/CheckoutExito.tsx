import { useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import { useCart } from "../hooks/useCart";
import {
  discardStashedPurchase,
  trackStashedPurchase,
} from "../lib/analytics";
import {
  SETTINGS_DEFAULTS,
  useStoreSettings,
} from "../hooks/useStoreSettings";
import { cn } from "../lib/cn";
import { formatPrice } from "../lib/format";

type OrderState = {
  orderNumber?: string;
  nombre?: string;
  email?: string;
  pago?: "mp" | "transferencia";
  total?: number;
};

export default function CheckoutExito() {
  const { state } = useLocation() as { state: OrderState | null };
  const [searchParams] = useSearchParams();
  const clearCart = useCart((s) => s.clear);
  // El alias bancario se edita en /admin/pagos
  const { data: settings } = useStoreSettings();
  const alias = (settings?.pagos ?? SETTINGS_DEFAULTS.pagos).transferencia
    .alias;

  // Regreso de Mercado Pago: llega por query params, sin router state
  const mpStatus =
    searchParams.get("status") ?? searchParams.get("collection_status");
  const externalRef = searchParams.get("external_reference");
  const fromMP = Boolean(mpStatus || externalRef);
  const isPending = mpStatus === "pending" || mpStatus === "in_process";

  // Se completó el checkout: vaciamos el carrito una sola vez.
  // (En transferencia ya se vació en el Checkout; esto cubre el regreso de MP.)
  useEffect(() => {
    if (fromMP) clearCart();
  }, [fromMP, clearCart]);

  // `purchase` va acá, que es donde la compra queda cerrada, con los datos que
  // el checkout guardó antes de redirigir. Un pago en proceso (efectivo, que se
  // acredita horas después) no se cuenta como venta: todavía puede no entrar.
  // El panel sí lo va a contar cuando el webhook lo marque pagado.
  useEffect(() => {
    if (isPending) discardStashedPurchase();
    else trackStashedPurchase();
  }, [isPending]);

  const nombre = state?.nombre;
  const pago = state?.pago ?? (fromMP ? "mp" : undefined);
  const orderNumber =
    state?.orderNumber ??
    (externalRef ? externalRef.slice(0, 8).toUpperCase() : undefined);

  return (
    <div className="px-5 py-16 sm:px-8 md:py-24 lg:px-12">
      <Card className="mx-auto max-w-2xl overflow-hidden text-center">
        <div
          className={cn("pb-10 pt-10", isPending ? "bg-amarillo" : "bg-verde")}
        >
          <p className="text-5xl" aria-hidden="true">
            ✦ ✧ ✿
          </p>
          {isPending ? (
            <h1 className="mt-4 px-6 text-4xl font-bold tracking-tight sm:text-5xl">
              Pago{" "}
              <em className="font-serif font-normal italic">en proceso</em>
            </h1>
          ) : (
            <h1 className="mt-4 px-6 text-4xl font-bold tracking-tight sm:text-5xl">
              {nombre ? `¡Listo, ${nombre}!` : "¡Listo!"}{" "}
              <em className="font-serif font-normal italic text-cream">
                Ya es tuyo.
              </em>
            </h1>
          )}
        </div>

        <div className="px-6 pb-10 pt-6 sm:px-12">
          {orderNumber && (
            <p className="inline-flex rounded-full bg-amarillo px-4 py-1.5 font-mono text-xs font-medium uppercase tracking-widest">
              Pedido #{orderNumber}
            </p>
          )}

          {isPending ? (
            <p className="mt-6 leading-relaxed">
              Mercado Pago está procesando tu pago. Apenas se acredite te
              mandamos la confirmación por email. Si pagaste en efectivo, puede
              tardar unas horas.
            </p>
          ) : (
            <p className="mt-6 leading-relaxed">
              {state?.email
                ? `Te mandamos el detalle a ${state.email}.`
                : "Te mandamos el detalle por email."}{" "}
              Ya casi lo tenés.
            </p>
          )}

          {typeof state?.total === "number" && (
            <p className="mt-3 font-mono text-lg font-medium tracking-wider">
              Total: {formatPrice(state.total)}
            </p>
          )}

          {pago === "transferencia" && (
            <div className="mt-8 rounded-2xl bg-lila p-6 text-left">
              <p className="font-mono text-xs font-medium uppercase tracking-widest">
                ✧ Falta un paso
              </p>
              <p className="mt-2 text-sm leading-relaxed">
                Transferí el total a{" "}
                <span className="font-mono">{alias}</span> y mandanos
                el comprobante por WhatsApp. Te reservamos todo por 48 horas —
                después vuelve a la tienda y ya sabés cómo es esto de las
                ediciones limitadas.
              </p>
            </div>
          )}

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Button to="/tienda">Seguir mirando ✦</Button>
            <Button to="/" variant="secondary">
              Volver al inicio
            </Button>
          </div>

          {orderNumber && (
            <p className="mt-6 text-xs text-ink/65">
              <Link
                to="/pedido"
                state={{ orderNumber }}
                className="font-semibold text-ink underline"
              >
                Seguí el estado de tu pedido ↗
              </Link>
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
