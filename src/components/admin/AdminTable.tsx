import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export type Column = {
  label: string;
  align?: "left" | "right" | "center";
  /** Oculta la columna en pantallas chicas */
  hideOnMobile?: boolean;
  /** Si se pasa junto con `sort`/`onSortChange` en la tabla, el header
   *  se vuelve clickeable para ordenar por esta clave. */
  sortKey?: string;
};

type AdminTableProps = {
  columns: Column[];
  children: ReactNode;
  /** Se muestra cuando no hay filas */
  empty?: ReactNode;
  isEmpty?: boolean;
  isLoading?: boolean;
  className?: string;
  /** Orden activo, si la tabla es ordenable */
  sort?: { key: string; dir: "asc" | "desc" } | null;
  /** Se llama con el `sortKey` de la columna clickeada; decidir el toggle
   *  de dirección queda del lado de quien la use. */
  onSortChange?: (key: string) => void;
};

export function alignClass(align: Column["align"]): string {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}

/** Envoltorio de tabla del panel: scroll horizontal propio (la página nunca
 *  scrollea de lado) y un solo lugar donde vive el estilo de las celdas. */
export default function AdminTable({
  columns,
  children,
  empty,
  isEmpty,
  isLoading,
  className,
  sort,
  onSortChange,
}: AdminTableProps) {
  return (
    <div className={cn("overflow-hidden rounded-2xl bg-white", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/10">
              {columns.map((column) => {
                const sortable = Boolean(column.sortKey && onSortChange);
                const active = sortable && sort?.key === column.sortKey;
                return (
                  <th
                    key={column.label}
                    scope="col"
                    aria-sort={
                      active ? (sort?.dir === "asc" ? "ascending" : "descending") : undefined
                    }
                    className={cn(
                      "whitespace-nowrap px-4 py-3.5 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-ink/65",
                      alignClass(column.align),
                      column.hideOnMobile && "hidden sm:table-cell",
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => onSortChange?.(column.sortKey as string)}
                        className={cn(
                          "inline-flex items-center gap-1 transition-colors hover:text-ink",
                          column.align === "right" && "flex-row-reverse",
                          active && "text-ink",
                        )}
                      >
                        {column.label}
                        <span className={cn("text-[9px]", !active && "text-ink/55")}>
                          {active ? (sort?.dir === "asc" ? "↑" : "↓") : "↕"}
                        </span>
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="animate-pulse px-4 py-16 text-center font-mono text-xs uppercase tracking-widest text-ink/65"
                >
                  ✦ Cargando…
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center text-sm text-ink/65"
                >
                  {empty ?? "Todavía no hay nada por acá."}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
