import { dayKey } from "../../lib/admin";
import { cn } from "../../lib/cn";
import {
  DIAS_CORTOS,
  FORMAT_LABEL,
  STATUS_DOT,
  STATUS_LABEL,
  esHoy,
  formatHora,
  monthGrid,
  porDia,
} from "../../lib/contenido";
import type { ContentPost } from "../../types/admin";

type ContentMonthProps = {
  year: number;
  month: number;
  posts: ContentPost[];
  onSelect: (post: ContentPost) => void;
  /** Clic en un día vacío: alta rápida con la fecha ya puesta */
  onAddOn: (date: string) => void;
};

/** La grilla del mes. En pantallas chicas no se achica: scrollea de costado
 *  dentro de su caja, como las tablas del panel — la página nunca scrollea. */
export default function ContentMonth({
  year,
  month,
  posts,
  onSelect,
  onAddOn,
}: ContentMonthProps) {
  const dias = monthGrid(year, month);
  const agrupadas = porDia(posts);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[46rem]">
        <div className="grid grid-cols-7 gap-2 pb-2">
          {DIAS_CORTOS.map((dia) => (
            <div
              key={dia}
              className="px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/65"
            >
              {dia}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {dias.map((date) => {
            const key = dayKey(date);
            const delMes = date.getMonth() === month;
            const delDia = agrupadas.get(key) ?? [];
            const hoy = esHoy(date);

            return (
              <div
                key={key}
                className={cn(
                  "group flex min-h-[7.5rem] flex-col rounded-xl p-2",
                  delMes ? "bg-white" : "bg-white/45",
                )}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span
                    className={cn(
                      "flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 font-mono text-[11px]",
                      hoy && "bg-ink text-cream",
                      !hoy && delMes && "text-ink/70",
                      !hoy && !delMes && "text-ink/35",
                    )}
                  >
                    {date.getDate()}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAddOn(key)}
                    aria-label={`Agregar una pieza el ${key}`}
                    className="rounded-full px-1.5 font-mono text-xs text-ink/0 transition-colors hover:bg-ink/5 hover:text-ink focus-visible:text-ink/70 group-hover:text-ink/40"
                  >
                    +
                  </button>
                </div>

                <ul className="space-y-1">
                  {delDia.map((post) => (
                    <li key={post.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(post)}
                        title={`${STATUS_LABEL[post.status]} · ${FORMAT_LABEL[post.format]}`}
                        className="flex w-full items-start gap-1.5 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-cream"
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "mt-[0.3rem] h-1.5 w-1.5 shrink-0 rounded-full",
                            STATUS_DOT[post.status],
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-mono text-[10px] text-ink/65">
                            {post.format === "tarea"
                              ? FORMAT_LABEL.tarea
                              : formatHora(post.scheduledAt)}
                          </span>
                          <span
                            className={cn(
                              "block line-clamp-2 text-[11px] leading-snug",
                              post.status === "publicado" && "text-ink/45",
                              post.status === "pospuesto" && "text-ink/45",
                            )}
                          >
                            {post.title}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
