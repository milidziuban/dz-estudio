import { RANGES, type RangeId } from "../../lib/admin";
import { cn } from "../../lib/cn";

type RangeTabsProps = {
  value: RangeId;
  onChange: (range: RangeId) => void;
};

export default function RangeTabs({ value, onChange }: RangeTabsProps) {
  return (
    <div
      role="group"
      aria-label="Rango de fechas"
      className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-white p-1 [scrollbar-width:none]"
    >
      {RANGES.map((range) => (
        <button
          key={range.id}
          type="button"
          aria-pressed={value === range.id}
          onClick={() => onChange(range.id)}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-widest transition-colors active:scale-[0.97]",
            value === range.id
              ? "bg-ink text-cream"
              : "text-ink/65 hover:text-ink",
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
