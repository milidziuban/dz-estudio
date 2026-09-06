import { useRef, useState } from "react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import PageHeading from "../../components/admin/PageHeading";
import QueryError from "../../components/admin/QueryError";
import StatCard from "../../components/admin/StatCard";
import ContentMonth from "../../components/admin/ContentMonth";
import Button from "../../components/Button";
import SelectField from "../../components/SelectField";
import TextField from "../../components/TextField";
import TextareaField from "../../components/TextareaField";
import {
  draftFromPost,
  emptyContentDraft,
  useContentPosts,
  useDeleteContentPost,
  useSaveContentPost,
  useSetContentStatus,
  type ContentPostDraft,
} from "../../hooks/useContentPosts";
import { dayKey, errorMessage } from "../../lib/admin";
import { cn } from "../../lib/cn";
import {
  CHANNEL_LABEL,
  FORMAT_LABEL,
  KIND_LABEL,
  MEZCLA_SEMANAL,
  STATUS_DOT,
  STATUS_LABEL,
  formatDiaLargo,
  formatHora,
  formatMes,
  pendiente,
  porDia,
  postsDelMes,
} from "../../lib/contenido";
import { uploadContentImage } from "../../lib/storage";
import type {
  ContentChannel,
  ContentFormat,
  ContentKind,
  ContentPost,
  ContentStatus,
} from "../../types/admin";

type Vista = "mes" | "agenda";

export default function AdminContenido() {
  const posts = useContentPosts();
  const savePost = useSaveContentPost();
  const deletePost = useDeleteContentPost();
  const setStatus = useSetContentStatus();

  const [cursor, setCursor] = useState(() => {
    const hoy = new Date();
    return { year: hoy.getFullYear(), month: hoy.getMonth() };
  });
  // En el celular la grilla de siete columnas entra a la fuerza: ahí la lista
  // es la vista útil. En escritorio arranca el calendario.
  const [vista, setVista] = useState<Vista>(() =>
    window.matchMedia("(min-width: 768px)").matches ? "mes" : "agenda",
  );
  const [draft, setDraft] = useState<ContentPostDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const todas = posts.data ?? [];
  const delMes = postsDelMes(todas, cursor.year, cursor.month);
  const publicadas = delMes.filter((post) => post.status === "publicado");
  const listas = delMes.filter((post) => post.status === "listo");
  const sinFoto = delMes.filter(
    (post) => pendiente(post) && post.format !== "tarea" && !post.mediaUrl,
  );

  const moverMes = (delta: number) => {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  const irAHoy = () => {
    const hoy = new Date();
    setCursor({ year: hoy.getFullYear(), month: hoy.getMonth() });
  };

  const abrirNueva = (date: string) => {
    setFormError(null);
    setCopiado(false);
    setDraft(emptyContentDraft(date));
  };

  const abrirPieza = (post: ContentPost) => {
    setFormError(null);
    setCopiado(false);
    setDraft(draftFromPost(post));
  };

  const guardar = async () => {
    if (!draft) return;
    setFormError(null);
    if (!draft.title.trim()) {
      setFormError("Falta el título de la pieza");
      return;
    }
    if (!draft.date) {
      setFormError("Falta el día");
      return;
    }
    try {
      await savePost.mutateAsync(draft);
      setDraft(null);
    } catch (error) {
      setFormError(errorMessage(error, "No se pudo guardar la pieza"));
    }
  };

  const subirFoto = async (file: File) => {
    if (!draft) return;
    setFormError(null);
    setSubiendo(true);
    try {
      const url = await uploadContentImage(file);
      setDraft({ ...draft, mediaUrl: url });
    } catch (error) {
      setFormError(errorMessage(error, "No se pudo subir la foto"));
    } finally {
      setSubiendo(false);
    }
  };

  const copiarTexto = () => {
    if (!draft) return;
    const texto = draft.hashtags.trim()
      ? `${draft.copy.trim()}\n\n${draft.hashtags.trim()}`
      : draft.copy.trim();
    navigator.clipboard
      .writeText(texto)
      .then(() => setCopiado(true))
      .catch(() => setFormError("El navegador no dejó copiar el texto"));
  };

  const marcarPublicado = (post: ContentPost) =>
    setStatus.mutate({
      id: post.id,
      status: post.status === "publicado" ? "listo" : "publicado",
      publishedAt: post.publishedAt,
    });

  return (
    <>
      <PageHeading
        title={
          <>
            Contenido y{" "}
            <em className="font-serif font-normal italic text-pink">redes</em>
          </>
        }
        description="Qué se publica, qué día y a qué hora. Cada pieza guarda la foto, el guion y el texto listo para copiar y pegar."
      >
        <div className="flex items-center gap-1 rounded-full bg-white p-1">
          {(["mes", "agenda"] as Vista[]).map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => setVista(opcion)}
              className={cn(
                "rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors",
                vista === opcion
                  ? "bg-ink text-cream"
                  : "text-ink/65 hover:text-ink",
              )}
            >
              {opcion === "mes" ? "Calendario" : "Agenda"}
            </button>
          ))}
        </div>
        <Button
          className="px-6 py-3"
          onClick={() => abrirNueva(dayKey(new Date()))}
        >
          + Nueva pieza
        </Button>
      </PageHeading>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Piezas del mes"
          value={delMes.length.toLocaleString("es-AR")}
          hint="incluye historias y tareas"
        />
        <StatCard
          label="Listas para subir"
          value={listas.length.toLocaleString("es-AR")}
          hint="foto y texto terminados"
        />
        <StatCard
          label="Sin foto todavía"
          value={sinFoto.length.toLocaleString("es-AR")}
          hint="es lo primero que frena una pieza"
        />
        <StatCard
          label="Publicadas"
          value={publicadas.length.toLocaleString("es-AR")}
          hint={`de ${delMes.length} planificadas`}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => moverMes(-1)}
            aria-label="Mes anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-mono text-sm transition-colors hover:bg-ink hover:text-cream"
          >
            ‹
          </button>
          <h2 className="min-w-[10rem] text-center font-mono text-xs font-medium uppercase tracking-[0.15em]">
            {formatMes(cursor.year, cursor.month)}
          </h2>
          <button
            type="button"
            onClick={() => moverMes(1)}
            aria-label="Mes siguiente"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-mono text-sm transition-colors hover:bg-ink hover:text-cream"
          >
            ›
          </button>
          <button
            type="button"
            onClick={irAHoy}
            className="ml-1 font-mono text-[10px] uppercase tracking-widest text-ink/65 transition-colors hover:text-ink"
          >
            Hoy
          </button>
        </div>

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {(Object.keys(STATUS_LABEL) as ContentStatus[]).map((status) => (
            <li
              key={status}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-ink/65"
            >
              <span
                aria-hidden="true"
                className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])}
              />
              {STATUS_LABEL[status]}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        {posts.error ? (
          <QueryError
            error={posts.error}
            what="el calendario de contenido"
            migration="supabase/migrations/20260906120000_calendario_de_contenido.sql"
          />
        ) : posts.isLoading ? (
          <p className="animate-pulse rounded-2xl bg-white px-4 py-16 text-center font-mono text-xs uppercase tracking-widest text-ink/65">
            ✦ Cargando…
          </p>
        ) : vista === "mes" ? (
          <ContentMonth
            year={cursor.year}
            month={cursor.month}
            posts={delMes}
            onSelect={abrirPieza}
            onAddOn={abrirNueva}
          />
        ) : (
          <Agenda
            posts={delMes}
            onSelect={abrirPieza}
            onTogglePublicado={marcarPublicado}
          />
        )}
      </div>

      <MezclaDelMes posts={delMes} />

      <AdminDrawer
        open={draft !== null}
        onClose={() => setDraft(null)}
        wide
        title={draft?.id ? "Editar pieza" : "Nueva pieza"}
        subtitle="Si la foto no está cargada, la pieza no está lista."
        footer={
          <div className="space-y-3">
            {formError && (
              <p role="alert" className="text-xs font-semibold text-orange">
                ✕ {formError}
              </p>
            )}
            <div className="flex gap-3">
              <Button
                className="flex-1 disabled:opacity-50"
                disabled={savePost.isPending || subiendo}
                onClick={() => void guardar()}
              >
                {savePost.isPending ? "Guardando…" : "Guardar ✦"}
              </Button>
              <Button variant="secondary" onClick={() => setDraft(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        }
      >
        {draft && (
          <div className="space-y-4">
            <TextField
              id="c-title"
              label="Título"
              placeholder="Producto — almohadón rombo rosa"
              value={draft.title}
              onChange={(event) =>
                setDraft({ ...draft, title: event.target.value })
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <TextField
                id="c-date"
                label="Día"
                type="date"
                value={draft.date}
                onChange={(event) =>
                  setDraft({ ...draft, date: event.target.value })
                }
              />
              <TextField
                id="c-time"
                label="Hora"
                type="time"
                value={draft.time}
                onChange={(event) =>
                  setDraft({ ...draft, time: event.target.value })
                }
              />
            </div>
            <p className="-mt-1 text-[11px] leading-relaxed text-ink/65">
              Los dos picos de Instagram acá son el mediodía (13-14 h) y la
              noche (19-21 h).
            </p>

            <div className="grid grid-cols-2 gap-3">
              <SelectField
                id="c-format"
                label="Formato"
                value={draft.format}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    format: event.target.value as ContentFormat,
                  })
                }
              >
                {(Object.keys(FORMAT_LABEL) as ContentFormat[]).map((f) => (
                  <option key={f} value={f}>
                    {FORMAT_LABEL[f]}
                  </option>
                ))}
              </SelectField>
              <SelectField
                id="c-kind"
                label="Tipo"
                value={draft.kind}
                onChange={(event) =>
                  setDraft({ ...draft, kind: event.target.value as ContentKind })
                }
              >
                {(Object.keys(KIND_LABEL) as ContentKind[]).map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]}
                  </option>
                ))}
              </SelectField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SelectField
                id="c-channel"
                label="Dónde"
                value={draft.channel}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    channel: event.target.value as ContentChannel,
                  })
                }
              >
                {(Object.keys(CHANNEL_LABEL) as ContentChannel[]).map((c) => (
                  <option key={c} value={c}>
                    {CHANNEL_LABEL[c]}
                  </option>
                ))}
              </SelectField>
              <SelectField
                id="c-status"
                label="Estado"
                value={draft.status}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    status: event.target.value as ContentStatus,
                  })
                }
              >
                {(Object.keys(STATUS_LABEL) as ContentStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </SelectField>
            </div>

            <div>
              <p className="mb-1.5 font-mono text-xs font-medium uppercase tracking-widest">
                Foto
              </p>
              {draft.mediaUrl ? (
                <div className="flex items-start gap-3">
                  <img
                    src={draft.mediaUrl}
                    alt=""
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, mediaUrl: "" })}
                    className="font-mono text-[10px] uppercase tracking-widest text-orange/70 transition-colors hover:text-orange"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <p className="text-[11px] leading-relaxed text-ink/65">
                  Todavía no hay foto. Subí la que va a salir, o la de
                  referencia si la definitiva no está sacada.
                </p>
              )}
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void subirFoto(file);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={subiendo}
                onClick={() => fileInput.current?.click()}
                className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink/65 transition-colors hover:text-ink disabled:opacity-50"
              >
                {subiendo ? "Subiendo…" : "+ Subir foto"}
              </button>
            </div>

            <TextareaField
              id="c-brief"
              label="Qué es"
              rows={4}
              placeholder="Las tomas, el guion, la idea. Lo que necesitás para producirla sin volver a pensarla."
              value={draft.brief}
              onChange={(event) =>
                setDraft({ ...draft, brief: event.target.value })
              }
            />

            <div>
              <TextareaField
                id="c-copy"
                label="Texto del posteo"
                rows={6}
                placeholder="Primera línea concreta, dos a cuatro líneas de cuerpo, y una sola acción al final."
                value={draft.copy}
                onChange={(event) =>
                  setDraft({ ...draft, copy: event.target.value })
                }
              />
              {draft.copy.trim() && (
                <button
                  type="button"
                  onClick={copiarTexto}
                  className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink/65 transition-colors hover:text-ink"
                >
                  {copiado ? "✓ Copiado" : "Copiar texto + hashtags"}
                </button>
              )}
            </div>

            <TextareaField
              id="c-hashtags"
              label="Hashtags"
              rows={2}
              placeholder="#dechome #textilartesanal #almohadones"
              value={draft.hashtags}
              onChange={(event) =>
                setDraft({ ...draft, hashtags: event.target.value })
              }
            />

            {(draft.status === "publicado" || draft.status === "pospuesto") && (
              <TextareaField
                id="c-result"
                label="Qué pasó"
                rows={3}
                placeholder="Guardados, mensajes, si vendió algo. Una línea alcanza."
                value={draft.result}
                onChange={(event) =>
                  setDraft({ ...draft, result: event.target.value })
                }
              />
            )}

            {draft.id && (
              <div className="border-t border-ink/10 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    const id = draft.id;
                    if (id && window.confirm(`¿Borrar "${draft.title}"?`)) {
                      deletePost.mutate(id);
                      setDraft(null);
                    }
                  }}
                  className="font-mono text-[10px] uppercase tracking-widest text-orange/70 transition-colors hover:text-orange"
                >
                  Borrar la pieza
                </button>
              </div>
            )}
          </div>
        )}
      </AdminDrawer>
    </>
  );
}

// ── Agenda ────────────────────────────────────────────────────

type AgendaProps = {
  posts: ContentPost[];
  onSelect: (post: ContentPost) => void;
  onTogglePublicado: (post: ContentPost) => void;
};

/** La misma información del calendario, en lista: día por día, con la foto y
 *  el atajo para marcar publicado sin abrir la ficha. */
function Agenda({ posts, onSelect, onTogglePublicado }: AgendaProps) {
  const dias = [...porDia(posts).entries()];

  if (dias.length === 0) {
    return (
      <p className="rounded-2xl bg-white px-4 py-16 text-center text-sm text-ink/65">
        Este mes todavía no tiene nada planificado.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {dias.map(([key, delDia]) => (
        <section key={key}>
          <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/65">
            {formatDiaLargo(new Date(`${key}T12:00`))}
          </h3>
          <ul className="space-y-2">
            {delDia.map((post) => (
              <li
                key={post.id}
                className="flex items-center gap-4 rounded-2xl bg-white p-3"
              >
                <button
                  type="button"
                  onClick={() => onSelect(post)}
                  className="flex min-w-0 flex-1 items-center gap-4 text-left"
                >
                  {post.mediaUrl ? (
                    <img
                      src={post.mediaUrl}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-cream text-center font-mono text-[9px] uppercase tracking-widest text-ink/45">
                      {post.format === "tarea" ? "✦" : "sin foto"}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs">
                        {post.format === "tarea"
                          ? FORMAT_LABEL.tarea
                          : formatHora(post.scheduledAt)}
                      </span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          STATUS_DOT[post.status],
                        )}
                      />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-ink/65">
                        {STATUS_LABEL[post.status]}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-semibold">
                      {post.title}
                    </span>
                    <span className="block truncate font-mono text-[10px] uppercase tracking-widest text-ink/65">
                      {FORMAT_LABEL[post.format]} · {KIND_LABEL[post.kind]} ·{" "}
                      {CHANNEL_LABEL[post.channel]}
                    </span>
                  </span>
                </button>

                {post.format !== "tarea" && (
                  <button
                    type="button"
                    onClick={() => onTogglePublicado(post)}
                    className="shrink-0 whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-ink/65 transition-colors hover:text-ink"
                  >
                    {post.status === "publicado"
                      ? "Despublicar"
                      : "Marcar publicado"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// ── Mezcla del mes ────────────────────────────────────────────

/** El control que pide `Reglas de contenido.md`: dos de producto, uno de
 *  proceso, uno de uso y uno de cercanía por semana. Acá se ve si el mes se
 *  fue todo para un lado. */
function MezclaDelMes({ posts }: { posts: ContentPost[] }) {
  const publicables = posts.filter((post) => post.format !== "tarea");
  const semanas = 4;

  return (
    <section className="mt-8 rounded-2xl bg-white p-6 sm:p-7">
      <h2 className="font-mono text-xs font-medium uppercase tracking-[0.15em]">
        Mezcla del mes
      </h2>
      <p className="mt-2 max-w-2xl text-xs leading-relaxed text-ink/65">
        La regla del vault es por semana: 2 de producto, 1 de proceso, 1 de uso
        y 1 de cercanía. Esto es el mes contra esa cuenta, para ver si se fue
        todo para un lado.
      </p>
      <ul className="mt-6 space-y-3">
        {MEZCLA_SEMANAL.map(({ kind, cada }) => {
          const hay = publicables.filter((post) => post.kind === kind).length;
          const objetivo = cada * semanas;
          const ancho = Math.min(100, (hay / objetivo) * 100);
          return (
            <li key={kind} className="flex items-center gap-4">
              <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-widest text-ink/65">
                {KIND_LABEL[kind]}
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10">
                <span
                  className="block h-full rounded-full bg-ink"
                  style={{ width: `${ancho}%` }}
                />
              </span>
              <span className="w-16 shrink-0 text-right font-mono text-[11px] text-ink/65">
                {hay} / {objetivo}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
