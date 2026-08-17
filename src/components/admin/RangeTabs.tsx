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
      className="flex flex-wrap gap-1 rounded-full bg-white p-1"
    >
      {RANGES.map((range) => (
        <button
          key={range.id}
          type="button"
          aria-pressed={value === range.id}
          onClick={() => onChange(range.id)}
          className={cn(
            "rounded-full px-3.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-widest transition-colors",
            value === range.id
              ? "bg-ink text-cream"
              : "text-ink/55 hover:text-ink",
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
