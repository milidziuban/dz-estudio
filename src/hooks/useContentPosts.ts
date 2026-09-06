import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { isoFromParts, localParts } from "../lib/contenido";
import type {
  ContentChannel,
  ContentFormat,
  ContentKind,
  ContentPost,
  ContentStatus,
} from "../types/admin";

type ContentPostRow = {
  id: string;
  created_at: string;
  ref: string | null;
  scheduled_at: string;
  title: string;
  kind: ContentKind;
  format: ContentFormat;
  channel: ContentChannel;
  status: ContentStatus;
  brief: string | null;
  copy_text: string | null;
  hashtags: string | null;
  media_url: string | null;
  result: string | null;
  published_at: string | null;
};

function mapPost(row: ContentPostRow): ContentPost {
  return {
    id: row.id,
    createdAt: row.created_at,
    ref: row.ref,
    scheduledAt: row.scheduled_at,
    title: row.title,
    kind: row.kind,
    format: row.format,
    channel: row.channel,
    status: row.status,
    brief: row.brief,
    copy: row.copy_text,
    hashtags: row.hashtags,
    mediaUrl: row.media_url,
    result: row.result,
    publishedAt: row.published_at,
  };
}

const KEY = ["admin", "content-posts"];

/** El calendario entero. Son decenas de filas por año: no vale la pena
 *  paginar ni filtrar por mes contra la base, el mes lo recorta la pantalla. */
export function useContentPosts() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<ContentPost[]> => {
      const { data, error } = await supabase
        .from("content_posts")
        .select("*")
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return (data as ContentPostRow[]).map(mapPost);
    },
    staleTime: 60 * 1000,
  });
}

export type ContentPostDraft = {
  id: string | null;
  /** YYYY-MM-DD, hora local */
  date: string;
  /** HH:MM, hora local */
  time: string;
  title: string;
  kind: ContentKind;
  format: ContentFormat;
  channel: ContentChannel;
  status: ContentStatus;
  brief: string;
  copy: string;
  hashtags: string;
  mediaUrl: string;
  result: string;
  /** La fecha real en que salió. No se edita a mano: se sella al pasar a
   *  publicado y se conserva mientras siga publicada. */
  publishedAt: string | null;
};

/** Una pieza nueva arranca a las 19 h: es el pico de la noche, el horario que
 *  más se repite en el calendario del vault. */
export function emptyContentDraft(date: string): ContentPostDraft {
  return {
    id: null,
    date,
    time: "19:00",
    title: "",
    kind: "producto",
    format: "feed",
    channel: "instagram",
    status: "idea",
    brief: "",
    copy: "",
    hashtags: "",
    mediaUrl: "",
    result: "",
    publishedAt: null,
  };
}

export function draftFromPost(post: ContentPost): ContentPostDraft {
  const { date, time } = localParts(post.scheduledAt);
  return {
    id: post.id,
    date,
    time,
    title: post.title,
    kind: post.kind,
    format: post.format,
    channel: post.channel,
    status: post.status,
    brief: post.brief ?? "",
    copy: post.copy ?? "",
    hashtags: post.hashtags ?? "",
    mediaUrl: post.mediaUrl ?? "",
    result: post.result ?? "",
    publishedAt: post.publishedAt,
  };
}

export function useSaveContentPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: ContentPostDraft) => {
      const row = {
        scheduled_at: isoFromParts(draft.date, draft.time),
        title: draft.title.trim(),
        kind: draft.kind,
        format: draft.format,
        channel: draft.channel,
        status: draft.status,
        brief: draft.brief.trim() || null,
        copy_text: draft.copy.trim() || null,
        hashtags: draft.hashtags.trim() || null,
        media_url: draft.mediaUrl.trim() || null,
        result: draft.result.trim() || null,
        // Se sella la primera vez que pasa a publicado y no se vuelve a pisar:
        // sirve para saber si la pieza salió a horario o corrida.
        published_at:
          draft.status === "publicado"
            ? (draft.publishedAt ?? new Date().toISOString())
            : null,
      };

      const { error } = draft.id
        ? await supabase.from("content_posts").update(row).eq("id", draft.id)
        : await supabase.from("content_posts").insert(row);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
}

/** El atajo del listado: marcar publicado (o volver atrás) sin abrir la ficha. */
export function useSetContentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      publishedAt,
    }: {
      id: string;
      status: ContentStatus;
      /** La que ya tenía. Solo se sella la primera vez. */
      publishedAt: string | null;
    }) => {
      const { error } = await supabase
        .from("content_posts")
        .update({
          status,
          published_at:
            status === "publicado"
              ? (publishedAt ?? new Date().toISOString())
              : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useDeleteContentPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("content_posts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
}
