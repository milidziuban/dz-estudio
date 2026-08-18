import { cn } from "../../lib/cn";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  /** Track más chico, para usar suelto dentro de una celda de tabla. */
  compact?: boolean;
  className?: string;
  title?: string;
};

/** El control en sí, sin label ni hint — para usar suelto en una tabla. */
export function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled,
  compact,
  className,
  title,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={title}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative shrink-0 rounded-full transition-colors",
        compact ? "h-5 w-9" : "h-6 w-11",
        checked ? "bg-verde" : "bg-ink/20",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-1 rounded-full bg-white transition-transform",
          compact ? "h-3 w-3" : "h-4 w-4",
          checked
            ? compact
              ? "translate-x-5"
              : "translate-x-6"
            : "translate-x-1",
        )}
      />
    </button>
  );
}

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
};

export default function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: ToggleProps) {
  return (
    <label
      className={cn(
        "flex items-start justify-between gap-4",
        disabled && "opacity-50",
      )}
    >
      <span>
        <span className="block font-mono text-xs font-medium uppercase tracking-widest">
          {label}
        </span>
        {hint && (
          <span className="mt-1 block text-xs leading-relaxed text-ink/55">
            {hint}
          </span>
        )}
      </span>
      <ToggleSwitch
        checked={checked}
        onChange={onChange}
        label={label}
        disabled={disabled}
        className="mt-0.5"
      />
    </label>
  );
}
