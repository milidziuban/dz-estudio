import { ORDER_STATUS_LABEL, SHIPPING_STATUS_LABEL } from "../../lib/admin";
import { cn } from "../../lib/cn";
import type { OrderStatus, ShippingStatus } from "../../types/admin";

const PAGO_CLASSES: Record<OrderStatus, string> = {
  pending: "bg-amarillo text-ink",
  paid: "bg-verde text-ink",
  rejected: "bg-orange text-cream",
  cancelled: "bg-ink/10 text-ink/70",
  refunded: "bg-lila text-ink",
};

const ENVIO_CLASSES: Record<ShippingStatus, string> = {
  pendiente: "bg-ink/10 text-ink/70",
  preparando: "bg-amarillo text-ink",
  despachado: "bg-celeste text-ink",
  entregado: "bg-verde text-ink",
};

type StatusBadgeProps =
  | { kind: "pago"; value: OrderStatus; className?: string }
  | { kind: "envio"; value: ShippingStatus; className?: string };

export default function StatusBadge(props: StatusBadgeProps) {
  const { label, classes } =
    props.kind === "pago"
      ? {
          label: ORDER_STATUS_LABEL[props.value],
          classes: PAGO_CLASSES[props.value],
        }
      : {
          label: SHIPPING_STATUS_LABEL[props.value],
          classes: ENVIO_CLASSES[props.value],
        };

  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1",
        "font-mono text-[10px] font-medium uppercase tracking-widest",
        classes,
        props.className,
      )}
    >
      {label}
    </span>
  );
}
