import { cn } from "../../lib/cn";

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
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-verde" : "bg-ink/20",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-1 h-4 w-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </label>
  );
}
