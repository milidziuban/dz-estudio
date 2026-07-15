import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
};

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, id, className, children, ...props }, ref) => (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block font-mono text-xs font-medium uppercase tracking-widest"
      >
        {label}
      </label>
      <select
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "w-full rounded-lg border bg-transparent px-4 py-3 font-mono text-sm",
          "transition-colors focus:border-ink focus:outline-none",
          error ? "border-orange" : "border-ink/25",
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-orange">
          ✕ {error}
        </p>
      )}
    </div>
  ),
);

SelectField.displayName = "SelectField";

export default SelectField;
