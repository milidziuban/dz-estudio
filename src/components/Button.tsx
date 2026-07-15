import type { ButtonHTMLAttributes, MouseEventHandler } from "react";
import { Link } from "react-router-dom";
import { cn } from "../lib/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  /** Si se pasa, renderiza un Link de react-router con estilo de botón */
  to?: string;
};

export default function Button({
  variant = "primary",
  to,
  className,
  children,
  onClick,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5",
    "font-mono text-xs font-medium uppercase tracking-widest",
    "transition-colors duration-200",
    variant === "primary"
      ? "bg-ink text-cream hover:bg-ink/80"
      : "border border-ink bg-transparent text-ink hover:bg-ink hover:text-cream",
    className,
  );

  if (to) {
    return (
      <Link
        to={to}
        className={classes}
        onClick={onClick as MouseEventHandler | undefined}
      >
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} onClick={onClick} {...props}>
      {children}
    </button>
  );
}
