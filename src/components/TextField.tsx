import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, id, className, ...props }, ref) => (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block font-mono text-xs font-medium uppercase tracking-widest"
      >
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "w-full rounded-lg border-2 bg-cream px-4 py-3 font-mono text-sm placeholder:text-ink/40",
          "focus:outline focus:outline-[3px] focus:outline-offset-2 focus:outline-pink",
          error ? "border-orange" : "border-ink",
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

TextField.displayName = "TextField";

export default TextField;
