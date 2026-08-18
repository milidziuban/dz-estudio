import { useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import Seo from "../components/Seo";
import Tag, { type TagColor } from "../components/Tag";
import TextField from "../components/TextField";
import {
  ORDER_STATUS_LABEL,
  SHIPPING_METHOD_LABEL,
  SHIPPING_STATUS_LABEL,
  errorMessage,
  formatDate,
} from "../lib/admin";
import { formatPrice } from "../lib/format";
import { SITE } from "../lib/site";
import { useOrderTracking, type OrderTracking } from "../hooks/useOrderTracking";
import type { OrderStatus, ShippingStatus } from "../types/admin";

const STATUS_COLOR: Record<OrderStatus, TagColor> = {
  pending: "amarillo",
  paid: "verde",
  rejected: "orange",
  cancelled: "orange",
  refunded: "lila",
};

const SHIPPING_COLOR: Record<ShippingStatus, TagColor> = {
  pendiente: "cream",
  preparando: "celeste",
  despachado: "petroleo",
  entregado: "verde",
};

export default function Pedido() {
  // Si venís del checkout te dejamos el código ya cargado; el email lo
  // volvés a escribir vos — no viaja en la URL ni en el state por afuera.
  const { state } = useLocation() as { state: { orderNumber?: string } | null };

  const [codigo, setCodigo] = useState(state?.orderNumber ?? "");
  const [email, setEmail] = useState("");
  const [notFound, setNotFound] = useState(false);
  const tracking = useOrderTracking();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotFound(false);
    tracking.mutate(
      { code: codigo, email },
      {
        onSuccess: (order) => setNotFound(order === null),
      },
    );
  };

  const order = tracking.data ?? null;

  return (
    <>
      <Seo
        title="Seguí tu pedido"
        description="Consultá el estado de tu pedido con el código de orden y el email con el que compraste."
        path="/pedido"
      />

      <div className="px-5 py-12 sm:px-8 md:py-16 lg:px-12">
        <div className="mx-auto max-w-xl">
          <p className="mb-3 font-mono text-xs font-medium uppercase tracking-widest">
            ✦ Seguimiento
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Seguí{" "}
            <em className="font-serif font-normal italic text-petroleo">
              tu pedido
            </em>
          </h1>
          <p className="mb-10 leading-relaxed">
            El código de orden es el que te mandamos al confirmar la compra —
            las primeras 8 letras y números, tipo{" "}
            <span className="font-mono text-xs">3F2A9C1B</span>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <TextField
              label="Código de pedido"
              id="p-codigo"
              name="codigo"
              placeholder="3F2A9C1B"
              value={codigo}
              onChange={(event) => setCodigo(event.target.value)}
              required
              className="[&_input]:uppercase [&_input]:tracking-widest"
            />
            <TextField
              label="Email con el que compraste"
              id="p-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Button
              type="submit"
              disabled={tracking.isPending}
              className="disabled:opacity-50"
            >
              {tracking.isPending ? "Buscando…" : "Buscar pedido ✦"}
            </Button>
          </form>

          {tracking.isError && (
            <p className="mt-6 text-sm font-semibold text-orange">
              ✕ {errorMessage(tracking.error, "No pudimos buscar el pedido.")}
            </p>
          )}

          {notFound && !tracking.isError && (
            <Card className="mt-8 bg-cream p-6">
              <p className="leading-relaxed">
                No encontramos ningún pedido con ese código y ese email.
                Revisá que estén bien escritos, o{" "}
                <a
                  href={SITE.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline"
                >
                  escribinos por WhatsApp
                </a>
                .
              </p>
            </Card>
          )}

          {order && <OrderSummary order={order} />}
        </div>
      </div>
    </>
  );
}

function OrderSummary({ order }: { order: OrderTracking }) {
  return (
    <Card className="mt-10 bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50">
            Pedido
          </p>
          <p className="font-mono text-lg font-medium">
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <p className="font-mono text-xs text-ink/55">
          {formatDate(order.createdAt)}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Tag color={STATUS_COLOR[order.status]}>
          {ORDER_STATUS_LABEL[order.status]}
        </Tag>
        <Tag color={SHIPPING_COLOR[order.shippingStatus]}>
          {SHIPPING_STATUS_LABEL[order.shippingStatus]}
        </Tag>
      </div>

      <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-ink/50">
        {SHIPPING_METHOD_LABEL[order.shippingMethod] ?? order.shippingMethod}
      </p>

      {order.trackingCode && (
        <div className="mt-5 rounded-xl bg-cream p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50">
            Código de seguimiento
          </p>
          <p className="mt-1 font-mono text-sm font-medium tracking-wider">
            {order.trackingCode}
          </p>
        </div>
      )}

      {order.items.length > 0 && (
        <ul className="mt-6 divide-y divide-ink/[0.08] border-t border-ink/[0.08]">
          {order.items.map((item, index) => (
            <li
              key={`${item.name}-${index}`}
              className="flex items-baseline justify-between gap-3 py-3 text-sm"
            >
              <span>
                {item.qty}× {item.name}
                {item.variant && (
                  <span className="text-ink/55"> · {item.variant}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-baseline justify-between border-t border-ink/10 pt-4">
        <span className="font-mono text-xs uppercase tracking-widest text-ink/55">
          Total
        </span>
        <span className="font-mono text-lg font-medium">
          {formatPrice(order.total)}
        </span>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-ink/55">
        ¿Algo no cierra?{" "}
        <a
          href={SITE.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-ink underline"
        >
          Escribinos por WhatsApp
        </a>{" "}
        con este código a mano.
      </p>
    </Card>
  );
}
