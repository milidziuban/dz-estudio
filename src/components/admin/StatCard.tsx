import { cn } from "../../lib/cn";
import { formatPercent } from "../../lib/admin";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  /** Variación % contra el período anterior. null = sin base de comparación */
  variation?: number | null;
  /** Cuando subir es malo (por ejemplo, ventas rechazadas) */
  invertVariation?: boolean;
};

export default function StatCard({
  label,
  value,
  hint,
  variation,
  invertVariation,
}: StatCardProps) {
  const showVariation = variation !== undefined && variation !== null;
  const positive = showVariation
    ? invertVariation
      ? variation! < 0
      : variation! > 0
    : false;
  const flat = showVariation && Math.abs(variation!) < 0.05;

  return (
    <div className="min-w-0 rounded-2xl bg-white p-4 sm:p-5">
      <p className="truncate font-mono text-[11px] uppercase tracking-[0.15em] text-ink/65">
        {label}
      </p>
      <p className="mt-2.5 truncate font-mono text-xl font-medium tabular-nums tracking-tight sm:text-2xl">
        {value}
      </p>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        {showVariation && (
          <span
            className={cn(
              "font-mono text-[11px] font-medium",
              flat ? "text-ink/65" : positive ? "text-verde-ink" : "text-orange-ink",
            )}
          >
            {flat ? "=" : variation! > 0 ? "↑" : "↓"}{" "}
            {formatPercent(Math.abs(variation!))}
          </span>
        )}
        {hint && <span className="text-xs leading-snug text-ink/65">{hint}</span>}
      </div>
    </div>
  );
}
