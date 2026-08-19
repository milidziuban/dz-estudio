import { useState } from "react";
import { cn } from "../../lib/cn";

type PriceCellProps = {
  value: number;
  onCommit: (next: number) => void;
  pending?: boolean;
  ariaLabel: string;
};

/** Precio editable en línea: se escribe el número directamente, se confirma
 *  al salir del campo o con Enter. Mismo patrón que StockCell. */
export default function PriceCell({
  value,
  onCommit,
  pending,
  ariaLabel,
}: PriceCellProps) {
  const [text, setText] = useState(String(value));

  const commit = () => {
    const parsed = Number(text);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setText(String(value));
      return;
    }
    const next = Math.round(parsed);
    setText(String(next));
    if (next === value) return;
    onCommit(next);
  };

  return (
    <div className="inline-flex items-center gap-1">
      <span className="font-mono text-xs text-ink/40">$</span>
      <input
        type="number"
        min={1}
        aria-label={ariaLabel}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onFocus={(event) => event.target.select()}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        className={cn(
          "w-24 rounded-lg border bg-transparent px-2 py-1 text-right font-mono text-xs focus:border-ink focus:outline-none",
          pending ? "border-celeste" : "border-ink/20",
        )}
      />
    </div>
  );
}
