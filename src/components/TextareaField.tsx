import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, id, className, rows = 4, ...props }, ref) => (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block font-mono text-xs font-medium uppercase tracking-widest"
      >
        {label}
      </label>
      <textarea
        id={id}
        ref={ref}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "w-full resize-y rounded-lg border bg-transparent px-4 py-3 text-sm leading-relaxed placeholder:text-ink/40",
          "transition-colors focus:border-ink focus:outline-none",
          error ? "border-orange" : "border-ink/25",
        )}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-orange">
          ✕ {error}
        </p>
      )}
    </div>
  ),
);

TextareaField.displayName = "TextareaField";

export default TextareaField;
