import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type PanelProps = {
  title: ReactNode;
  /** A la derecha del título: una aclaración corta o un link */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** La tarjeta blanca de cada bloque del panel, con su título en mono. Un solo
 *  lugar para el estilo que antes se repetía a mano en cada sección. */
export default function Panel({ title, aside, children, className }: PanelProps) {
  return (
    <section className={cn("min-w-0 rounded-2xl bg-white p-5 sm:p-6", className)}>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1.5">
        <h2 className="font-mono text-xs font-medium uppercase tracking-[0.15em]">
          {title}
        </h2>
        {aside && (
          <div className="font-mono text-[11px] text-ink/65">{aside}</div>
        )}
      </div>
      {children}
    </section>
  );
}
