import { CATEGORY_LABEL } from "../data/products";
import { COLOR_HEX, COLOR_LABEL } from "../lib/colors";
import { cn } from "../lib/cn";
import type { ColorToken } from "../types/product";

export type FiltersState = {
  categoria: string;
  color: string;
  precio: string;
};

export const PRICE_RANGES = [
  { id: "all", label: "Todos", min: 0, max: Infinity },
  { id: "under10", label: "Hasta $10.000", min: 0, max: 10000 },
  { id: "over10", label: "Más de $10.000", min: 10000, max: Infinity },
];

export const DEFAULT_FILTERS: FiltersState = {
  categoria: "all",
  color: "all",
  precio: "all",
};

type FiltersProps = {
  value: FiltersState;
  onChange: (patch: Partial<FiltersState>) => void;
  /** Colores presentes en el catálogo: evitamos ofrecer filtros vacíos */
  colorOptions: ColorToken[];
};

export default function Filters({
  value,
  onChange,
  colorOptions,
}: FiltersProps) {
  const pill = (selected: boolean) =>
    cn(
      "rounded-full border px-3.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-widest transition-colors",
      selected
        ? "border-ink bg-ink text-cream"
        : "border-ink/25 bg-transparent text-ink hover:border-ink",
    );

  const isDefault =
    value.categoria === "all" &&
    value.color === "all" &&
    value.precio === "all";

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 font-mono text-xs font-medium uppercase tracking-widest">
          ✦ Categoría
        </legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={pill(value.categoria === "all")}
            onClick={() => onChange({ categoria: "all" })}
          >
            Todas
          </button>
          {(Object.keys(CATEGORY_LABEL) as (keyof typeof CATEGORY_LABEL)[]).map(
            (cat) => (
              <button
                key={cat}
                type="button"
                className={pill(value.categoria === cat)}
                onClick={() => onChange({ categoria: cat })}
              >
                {CATEGORY_LABEL[cat]}
              </button>
            ),
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 font-mono text-xs font-medium uppercase tracking-widest">
          ✿ Color
        </legend>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            className={pill(value.color === "all")}
            onClick={() => onChange({ color: "all" })}
          >
            Todos
          </button>
          {colorOptions.map((token) => (
            <button
              key={token}
              type="button"
              aria-label={`Color ${COLOR_LABEL[token]}`}
              aria-pressed={value.color === token}
              title={COLOR_LABEL[token]}
              onClick={() =>
                onChange({ color: value.color === token ? "all" : token })
              }
              className={cn(
                "h-8 w-8 rounded-full border border-ink/20 transition-transform hover:scale-110",
                value.color === token &&
                  "ring-1 ring-ink ring-offset-2 ring-offset-cream",
              )}
              style={{ backgroundColor: COLOR_HEX[token] }}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 font-mono text-xs font-medium uppercase tracking-widest">
          ✧ Precio
        </legend>
        <div className="flex flex-wrap gap-2">
          {PRICE_RANGES.map((range) => (
            <button
              key={range.id}
              type="button"
              className={pill(value.precio === range.id)}
              onClick={() => onChange({ precio: range.id })}
            >
              {range.label}
            </button>
          ))}
        </div>
      </fieldset>

      {!isDefault && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="font-mono text-xs font-medium uppercase tracking-widest underline decoration-1 underline-offset-4 transition-colors hover:text-pink"
        >
          Limpiar filtros ✕
        </button>
      )}
    </div>
  );
}
