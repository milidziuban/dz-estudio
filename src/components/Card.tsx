import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

export default function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl bg-white",
        className,
      )}
      {...props}
    />
  );
}
