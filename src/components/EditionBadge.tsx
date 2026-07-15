import { cn } from "../lib/cn";

type EditionBadgeProps = {
  number: number;
  total: number;
  className?: string;
};

/** Sello editorial circular estilo timbre */
export default function EditionBadge({
  number,
  total,
  className,
}: EditionBadgeProps) {
  return (
    <div
      className={cn(
        "flex h-24 w-24 -rotate-6 flex-col items-center justify-center rounded-full bg-amarillo text-center",
        className,
      )}
    >
      <span className="font-serif text-sm italic leading-tight">
        edición
        <br />
        limitada
      </span>
      <span className="mt-1 font-mono text-[11px] font-medium tracking-wider">
        Nº {String(number).padStart(2, "0")}/{total}
      </span>
    </div>
  );
}
