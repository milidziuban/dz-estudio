import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export type Column = {
  label: string;
  align?: "left" | "right" | "center";
  /** Oculta la columna en pantallas chicas */
  hideOnMobile?: boolean;
};

type AdminTableProps = {
  columns: Column[];
  children: ReactNode;
  /** Se muestra cuando no hay filas */
  empty?: ReactNode;
  isEmpty?: boolean;
  isLoading?: boolean;
  className?: string;
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
}: AdminTableProps) {
  return (
    <div className={cn("overflow-hidden rounded-2xl bg-white", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/10">
              {columns.map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap px-4 py-3.5 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-ink/50",
                    alignClass(column.align),
                    column.hideOnMobile && "hidden sm:table-cell",
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="animate-pulse px-4 py-16 text-center font-mono text-xs uppercase tracking-widest text-ink/50"
                >
                  ✦ Cargando…
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center text-sm text-ink/50"
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
