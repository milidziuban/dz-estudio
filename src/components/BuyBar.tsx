import Button from "./Button";
import { cn } from "../lib/cn";
import { formatPrice } from "../lib/format";

type BuyBarProps = {
  /** La barra vive montada y entra deslizándose, como el carrito */
  visible: boolean;
  name: string;
  price: number;
  qty: number;
  variantLabel?: string;
  onAdd: () => void;
};

/** Barra fija de comprar, solo en mobile. Aparece cuando el botón de la ficha
 *  ya quedó arriba y se va al llegar al final, para no taparlo al footer. */
export default function BuyBar({
  visible,
  name,
  price,
  qty,
  variantLabel,
  onAdd,
}: BuyBarProps) {
  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-cream/95 backdrop-blur transition-transform duration-300 md:hidden",
        visible ? "translate-y-0" : "translate-y-full",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center gap-4 px-5 py-3">
        <div className="min-w-0 flex-1">
          {/* Con variante elegida gana la variante: los nombres traen medida y
              pack, así que pegarle el color atrás lo dejaba justo afuera del
              corte — se cortaba lo único que cambia */}
          <p className="truncate font-mono text-[11px] uppercase tracking-widest text-ink/65">
            {variantLabel ?? name}
          </p>
          <p className="mt-0.5 font-mono text-base font-medium tracking-wider">
            {formatPrice(price * qty)}
            {qty > 1 && (
              <span className="ml-2 text-[11px] tracking-widest text-ink/65">
                {qty} u.
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={onAdd}
          tabIndex={visible ? 0 : -1}
          className="shrink-0 px-6"
        >
          Agregar ✦
        </Button>
      </div>
    </div>
  );
}
