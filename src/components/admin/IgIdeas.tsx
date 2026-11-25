import { useState } from "react";
import Button from "../Button";
import {
  emptyContentDraft,
  useContentPosts,
  useSaveContentPost,
} from "../../hooks/useContentPosts";
import { errorMessage } from "../../lib/admin";
import { fechaLocal } from "../../lib/meta-ads";
import { IG_TIPO_LABEL } from "../../lib/instagram";
import type { IgIdea } from "../../types/instagram";

const dia = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

function formatoLabel(formato: IgIdea["formato"]): string {
  return formato === "carrusel" || formato === "reel" || formato === "historia"
    ? IG_TIPO_LABEL[formato]
    : "Foto";
}

/** Las ideas del informe, con un botón que las deja en Contenido y redes como
 *  "idea". Una que ya está en el calendario (mismo título) no se repite. */
export default function IgIdeas({ ideas }: { ideas: IgIdea[] }) {
  const posts = useContentPosts();
  const guardar = useSaveContentPost();
  const [pasando, setPasando] = useState<string | null>(null);

  const enCalendario = new Set((posts.data ?? []).map((p) => p.title));

  const pasar = (idea: IgIdea) => {
    setPasando(idea.titulo);
    guardar.mutate(
      {
        ...emptyContentDraft(idea.fecha),
        time: idea.hora,
        title: idea.titulo,
        kind: idea.tipo,
        format: idea.formato,
        brief: `${idea.brief}\n\nPor qué: ${idea.porque}`,
        copy: idea.primera,
      },
      { onSettled: () => setPasando(null) },
    );
  };

  return (
    <>
      {guardar.error && (
        <p role="alert" className="mb-4 text-sm text-orange-ink">
          No se pudo pasar al calendario.{" "}
          {errorMessage(guardar.error, "Probá de nuevo.")}
        </p>
      )}
      <ul>
        {ideas.map((idea) => {
          const ya = enCalendario.has(idea.titulo);
          return (
            <li
              key={idea.titulo}
              className="flex flex-col gap-4 border-b border-ink/10 py-5 first:pt-0 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 max-w-2xl">
                <p className="font-mono text-[11px] uppercase tracking-widest text-ink/65">
                  {formatoLabel(idea.formato)} · {dia.format(fechaLocal(idea.fecha))}{" "}
                  · {idea.hora}
                </p>
                <h3 className="mt-1.5 text-base font-bold leading-snug">
                  {idea.titulo}
                </h3>
                <p className="mt-2 font-serif text-lg italic leading-snug">
                  {idea.primera}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">
                  {idea.brief}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ink/65">
                  Por qué: {idea.porque}
                </p>
              </div>
              <div className="shrink-0">
                {ya ? (
                  <p className="font-mono text-[11px] uppercase tracking-widest text-verde-ink">
                    En el calendario
                  </p>
                ) : (
                  <Button
                    variant="secondary"
                    className="px-5 py-2.5"
                    disabled={guardar.isPending || posts.isLoading}
                    onClick={() => pasar(idea)}
                  >
                    {pasando === idea.titulo ? "Pasando…" : "Pasar al calendario"}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
