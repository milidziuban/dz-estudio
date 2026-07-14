import { useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import ScallopBorder from "../components/ScallopBorder";
import { useCart } from "../hooks/useCart";
import { BANK_INFO } from "../lib/checkout";
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

  const nombre = state?.nombre;
  const pago = state?.pago ?? (fromMP ? "mp" : undefined);
  const orderNumber =
    state?.orderNumber ??
    (externalRef ? externalRef.slice(0, 8).toUpperCase() : undefined);

  const headerColor = isPending ? "#F4C542" : "#7CB562";

  return (
    <div className="px-5 py-16 sm:px-8 md:py-24 lg:px-12">
      <Card className="mx-auto max-w-2xl overflow-hidden text-center">
        <div
          className="pb-4 pt-10"
          style={{ backgroundColor: headerColor }}
        >
          <p className="text-5xl" aria-hidden="true">
            ✦ ✧ ✿
          </p>
          {isPending ? (
            <h1 className="mt-4 px-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Pago{" "}
              <em className="font-serif font-normal italic">en proceso</em>
            </h1>
          ) : (
            <h1 className="mt-4 px-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
              {nombre ? `¡Listo, ${nombre}!` : "¡Listo!"}{" "}
              <em className="font-serif font-normal italic text-cream">
                Ya es tuyo.
              </em>
            </h1>
          )}
        </div>
        <ScallopBorder color={headerColor} direction="down" />

        <div className="px-6 pb-10 pt-6 sm:px-12">
          {orderNumber && (
            <p className="inline-flex rounded-full border-2 border-ink bg-amarillo px-4 py-1.5 font-mono text-xs font-medium uppercase tracking-widest">
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
              La mesa ya puede empezar a presumir.
            </p>
          )}

          {typeof state?.total === "number" && (
            <p className="mt-3 font-mono text-lg font-medium tracking-wider">
              Total: {formatPrice(state.total)}
            </p>
          )}

          {pago === "transferencia" && (
            <div className="mt-8 rounded-[14px] border-2 border-ink bg-lila p-6 text-left">
              <p className="font-mono text-xs font-medium uppercase tracking-widest">
                ✧ Falta un paso
              </p>
              <p className="mt-2 text-sm leading-relaxed">
                Transferí el total a{" "}
                <span className="font-mono">{BANK_INFO.alias}</span> y mandanos
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
        </div>
      </Card>
    </div>
  );
}
