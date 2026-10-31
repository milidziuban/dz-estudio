import { cn } from "../../lib/cn";

type SectionTabsProps<T extends string> = {
  tabs: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
};

/**
 * Pestañas para partir una pantalla larga en partes. Van subrayadas y no en
 * pill a propósito: las pills son filtros (rango, estado), y si las dos cosas
 * se vieran iguales no se entendería cuál cambia los números y cuál la vista.
 */
export default function SectionTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: SectionTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="-mx-5 mb-6 flex gap-6 overflow-x-auto border-b border-ink/10 px-5 [scrollbar-width:none] lg:mx-0 lg:px-0"
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              "-mb-px shrink-0 whitespace-nowrap border-b-2 pb-3 pt-1 font-mono text-[11px] font-medium uppercase tracking-[0.15em] transition-colors",
              active
                ? "border-ink text-ink"
                : "border-transparent text-ink/55 hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
