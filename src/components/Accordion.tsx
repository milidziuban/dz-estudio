import { useState } from "react";
import { cn } from "../lib/cn";

export type QA = { q: string; a: string };

type AccordionProps = {
  items: QA[];
  /** Prefijo para ids únicos entre categorías */
  idPrefix: string;
};

export default function Accordion({ items, idPrefix }: AccordionProps) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y divide-ink/15 border-y border-ink/15">
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${idPrefix}-panel-${i}`;
        const btnId = `${idPrefix}-btn-${i}`;
        return (
          <div key={i}>
            <h3>
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left"
              >
                <span className="text-base font-bold sm:text-lg">{item.q}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "shrink-0 text-xl font-normal transition-transform duration-200",
                    isOpen && "rotate-45 text-pink",
                  )}
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              hidden={!isOpen}
              className="pb-5 pr-11 text-sm leading-relaxed"
            >
              {item.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}
