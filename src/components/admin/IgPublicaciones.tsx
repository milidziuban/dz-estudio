import { useState } from "react";
import { formatDate, formatPercent } from "../../lib/admin";
import {
  alcanceSinPauta,
  feedDe,
  IG_TEMA_LABEL,
  IG_TIPO_LABEL,
  tasaSinPauta,
} from "../../lib/instagram";
import type { IgPost } from "../../types/instagram";
import AdminTable from "./AdminTable";

const ORDEN: Record<string, (p: IgPost) => number> = {
  fecha: (p) => new Date(p.publicado).getTime(),
  alcance: alcanceSinPauta,
  tasa: (p) => tasaSinPauta(p) ?? 0,
  guardados: (p) => p.guardados,
  compartidos: (p) => p.compartidos,
  segundos: (p) => p.segundos ?? 0,
};

/** Todas las publicaciones del feed, para ordenar por lo que se quiera. */
export default function IgPublicaciones({ posts }: { posts: IgPost[] }) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({
    key: "alcance",
    dir: "desc",
  });

  const filas = feedDe(posts).sort((a, b) => {
    const valor = ORDEN[sort.key];
    return (valor(b) - valor(a)) * (sort.dir === "desc" ? 1 : -1);
  });

  return (
    <>
      <AdminTable
        columns={[
          { label: "Publicación" },
          { label: "Fecha", align: "right", sortKey: "fecha" },
          { label: "Personas", align: "right", sortKey: "alcance" },
          { label: "Hacen algo", align: "right", sortKey: "tasa" },
          { label: "Guardados", align: "right", sortKey: "guardados" },
          {
            label: "Compartidos",
            align: "right",
            sortKey: "compartidos",
            hideOnMobile: true,
          },
          {
            label: "Se mira",
            align: "right",
            sortKey: "segundos",
            hideOnMobile: true,
          },
        ]}
        sort={sort}
        onSortChange={(key) =>
          setSort((actual) => ({
            key,
            dir: actual.key === key && actual.dir === "desc" ? "asc" : "desc",
          }))
        }
        isEmpty={filas.length === 0}
        empty="Todavía no hay publicaciones leídas."
      >
        {filas.map((p) => {
          const tasa = tasaSinPauta(p);
          return (
            <tr
              key={p.id}
              className="border-b border-ink/[0.06] last:border-0"
            >
              <td className="min-w-[14rem] px-4 py-3">
                <span className="block text-sm leading-snug">{p.texto}</span>
                <span className="mt-1 block font-mono text-[11px] text-ink/65">
                  {IG_TIPO_LABEL[p.tipo]}
                  {p.tema && ` · ${IG_TEMA_LABEL[p.tema]}`}
                  {p.alcancePago > 0 && " · con pauta"}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-ink/65">
                {formatDate(p.publicado)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-xs">
                {alcanceSinPauta(p).toLocaleString("es-AR")}
                {p.alcancePago > 0 && (
                  <span className="block whitespace-nowrap text-[11px] text-ink/65">
                    + {p.alcancePago.toLocaleString("es-AR")} pagas
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right font-mono text-xs">
                {tasa === null ? "—" : formatPercent(tasa, 1)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-xs">
                {p.guardados}
              </td>
              <td className="hidden px-4 py-3 text-right font-mono text-xs sm:table-cell">
                {p.compartidos}
              </td>
              <td className="hidden px-4 py-3 text-right font-mono text-xs sm:table-cell">
                {p.segundos === null ? "—" : `${p.segundos} s`}
              </td>
            </tr>
          );
        })}
      </AdminTable>
      <p className="mt-3 text-[11px] leading-relaxed text-ink/65">
        Personas y "hacen algo" (de cada 100) van sin la pauta, así se comparan
        parejo. Las de los últimos días todavía están juntando.
      </p>
    </>
  );
}
