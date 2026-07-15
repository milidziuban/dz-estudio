import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type TagColor =
  | "pink"
  | "orange"
  | "celeste"
  | "verde"
  | "lila"
  | "petroleo"
  | "amarillo"
  | "cream";

const colorClasses: Record<TagColor, string> = {
  pink: "bg-pink text-ink",
  orange: "bg-orange text-cream",
  celeste: "bg-celeste text-ink",
  verde: "bg-verde text-ink",
  lila: "bg-lila text-ink",
  petroleo: "bg-petroleo text-cream",
  amarillo: "bg-amarillo text-ink",
  cream: "bg-cream text-ink",
};

type TagProps = HTMLAttributes<HTMLSpanElement> & {
  color?: TagColor;
};

export default function Tag({ color = "cream", className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3.5 py-1.5",
        "font-mono text-[11px] font-medium uppercase tracking-widest",
        colorClasses[color],
        className,
      )}
      {...props}
    />
  );
}
