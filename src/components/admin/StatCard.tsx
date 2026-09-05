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
    <div className="rounded-2xl bg-white p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/65">
        {label}
      </p>
      <p className="mt-2.5 font-mono text-2xl font-medium tracking-tight">
        {value}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        {showVariation && (
          <span
            className={cn(
              "font-mono text-[11px] font-medium",
              flat ? "text-ink/65" : positive ? "text-verde" : "text-orange",
            )}
          >
            {flat ? "=" : variation! > 0 ? "↑" : "↓"}{" "}
            {formatPercent(Math.abs(variation!))}
          </span>
        )}
        {hint && <span className="text-[11px] text-ink/65">{hint}</span>}
      </div>
    </div>
  );
}
