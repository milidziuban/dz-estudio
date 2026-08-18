import { useState } from "react";
import { cn } from "../../lib/cn";

type StockCellProps = {
  value: number;
  onCommit: (next: number) => void;
  pending?: boolean;
  ariaLabel: string;
  className?: string;
};

/** Input de stock editable en línea: se escribe el número directamente,
 *  se confirma al salir del campo o con Enter. */
export default function StockCell({
  value,
  onCommit,
  pending,
  ariaLabel,
  className,
}: StockCellProps) {
  const [text, setText] = useState(String(value));

  const commit = () => {
    const parsed = Number(text);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setText(String(value));
      return;
    }
    const next = Math.floor(parsed);
    setText(String(next));
    if (next === value) return;
    onCommit(next);
  };

  return (
    <input
      type="number"
      min={0}
      aria-label={ariaLabel}
      value={text}
      onChange={(event) => setText(event.target.value)}
      onFocus={(event) => event.target.select()}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      className={cn(
        "w-16 rounded-lg border bg-transparent px-2 py-1 text-right font-mono text-xs focus:border-ink focus:outline-none",
        pending ? "border-celeste" : "border-ink/20",
        className,
      )}
    />
  );
}
