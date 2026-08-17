import { cn } from "../lib/cn";
import { INSTALLMENTS } from "../lib/promos";

// Medios habilitados en la tienda (Pago Nube + Mercado Pago).
const GROUPS = [
  {
    title: "Crédito",
    items: ["Visa", "Mastercard", "Amex", "Cabal", "Naranja", "Argencard"],
  },
  { title: "Débito", items: ["Visa Débito", "Maestro", "Cabal Débito"] },
  { title: "Efectivo", items: ["Pago Fácil", "Rapipago"] },
  { title: "Transferencia", items: ["10% de descuento"] },
];

type PaymentMethodsProps = {
  className?: string;
  /** `dark` para el footer (fondo ink), `light` para el resto */
  tone?: "light" | "dark";
};

export default function PaymentMethods({
  className,
  tone = "light",
}: PaymentMethodsProps) {
  return (
    <div className={className}>
      <p
        className={cn(
          "font-mono text-xs font-medium uppercase tracking-widest",
          tone === "dark" ? "text-amarillo" : "text-ink",
        )}
      >
        ✧ Medios de pago
      </p>
      <p
        className={cn(
          "mt-2 font-serif text-lg italic",
          tone === "dark" ? "text-cream" : "text-petroleo",
        )}
      >
        Hasta {INSTALLMENTS.label}
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <dt
              className={cn(
                "font-mono text-[11px] uppercase tracking-widest",
                tone === "dark" ? "text-cream/60" : "text-ink/60",
              )}
            >
              {group.title}
            </dt>
            <dd
              className={cn(
                "mt-1 text-sm leading-relaxed",
                tone === "dark" ? "text-cream/90" : "text-ink",
              )}
            >
              {group.items.join(" · ")}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
