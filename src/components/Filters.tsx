import { CATEGORY_LABEL, COLLECTIONS } from "../data/products";
import { COLOR_HEX, COLOR_LABEL } from "../lib/colors";
import { cn } from "../lib/cn";
import type { ColorToken } from "../types/product";

export type FiltersState = {
  categoria: string;
  coleccion: string;
  color: string;
  precio: string;
};

export const PRICE_RANGES = [
  { id: "all", label: "Todos", min: 0, max: Infinity },
  { id: "under20", label: "Hasta $20.000", min: 0, max: 20000 },
  { id: "20to40", label: "$20.000 a $40.000", min: 20000, max: 40000 },
  { id: "over40", label: "Más de $40.000", min: 40000, max: Infinity },
];

export const DEFAULT_FILTERS: FiltersState = {
  categoria: "all",
  coleccion: "all",
  color: "all",
  precio: "all",
};

const COLOR_OPTIONS: ColorToken[] = [
  "pink",
  "orange",
  "celeste",
  "verde",
  "lila",
  "petroleo",
  "amarillo",
  "ink",
  "cream",
];

type FiltersProps = {
  value: FiltersState;
  onChange: (patch: Partial<FiltersState>) => void;
};

export default function Filters({ value, onChange }: FiltersProps) {
  const pill = (selected: boolean) =>
    cn(
      "rounded-full border-2 border-ink px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-widest transition-colors",
      selected ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-amarillo",
    );

  const isDefault =
    value.categoria === "all" &&
    value.coleccion === "all" &&
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
          ✧ Colección
        </legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={pill(value.coleccion === "all")}
            onClick={() => onChange({ coleccion: "all" })}
          >
            Todas
          </button>
          {(Object.keys(COLLECTIONS) as (keyof typeof COLLECTIONS)[]).map(
            (id) => (
              <button
                key={id}
                type="button"
                className={pill(value.coleccion === id)}
                onClick={() => onChange({ coleccion: id })}
              >
                {COLLECTIONS[id].label}
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
          {COLOR_OPTIONS.map((token) => (
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
                "h-8 w-8 rounded-full border-2 border-ink transition-transform hover:scale-110",
                value.color === token &&
                  "ring-[3px] ring-ink ring-offset-2 ring-offset-cream",
              )}
              style={{ backgroundColor: COLOR_HEX[token] }}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 font-mono text-xs font-medium uppercase tracking-widest">
          ✦ Precio
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
          className="font-mono text-xs font-medium uppercase tracking-widest underline decoration-2 underline-offset-4 hover:decoration-pink"
        >
          Limpiar filtros ✕
        </button>
      )}
    </div>
  );
}
