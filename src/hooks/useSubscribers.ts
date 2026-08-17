import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Subscriber } from "../types/admin";

type SubscriberRow = {
  id: string;
  created_at: string;
  email: string;
  source: string;
  active: boolean;
};

export function useSubscribers() {
  return useQuery({
    queryKey: ["admin", "subscribers"],
    queryFn: async (): Promise<Subscriber[]> => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as SubscriberRow[]).map((row) => ({
        id: row.id,
        createdAt: row.created_at,
        email: row.email,
        source: row.source,
        active: row.active,
      }));
    },
    staleTime: 60 * 1000,
  });
}

export function useDeleteSubscriber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "subscribers"] });
    },
  });
}
