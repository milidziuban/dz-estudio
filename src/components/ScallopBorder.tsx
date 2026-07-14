import { useId } from "react";
import { cn } from "../lib/cn";

type ScallopBorderProps = {
  /** Color de relleno de los festones (hex o var CSS) */
  color?: string;
  /** "down": los festones apuntan hacia abajo (borde inferior de la pieza de arriba).
   *  "up": apuntan hacia arriba (borde superior de la pieza de abajo). */
  direction?: "down" | "up";
  height?: number;
  className?: string;
};

export default function ScallopBorder({
  color = "#1A1A1A",
  direction = "down",
  height = 14,
  className,
}: ScallopBorderProps) {
  const patternId = useId();

  return (
    <svg
      className={cn(
        "block w-full",
        direction === "up" && "rotate-180",
        className,
      )}
      height={height}
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={patternId}
          width={height * 2}
          height={height}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={height} cy={0} r={height} fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height={height} fill={`url(#${patternId})`} />
    </svg>
  );
}
