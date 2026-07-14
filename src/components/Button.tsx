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
    "inline-flex items-center justify-center gap-2 rounded-full border-[2.5px] border-ink px-7 py-3",
    "font-sans text-sm font-bold uppercase tracking-wide",
    "shadow-hard transition-all duration-150",
    "hover:-translate-y-0.5 hover:shadow-hard-lg",
    "active:translate-y-0 active:shadow-hard",
    variant === "primary" ? "bg-ink text-cream" : "bg-cream text-ink",
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
