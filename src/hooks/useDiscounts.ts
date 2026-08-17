import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Discount, DiscountKind } from "../types/admin";

type DiscountRow = {
  id: string;
  created_at: string;
  code: string;
  description: string | null;
  kind: DiscountKind;
  value: number;
  min_subtotal: number;
  max_uses: number | null;
  uses: number;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
};

function mapDiscount(row: DiscountRow): Discount {
  return {
    id: row.id,
    createdAt: row.created_at,
    code: row.code,
    description: row.description,
    kind: row.kind,
    value: row.value,
    minSubtotal: row.min_subtotal,
    maxUses: row.max_uses,
    uses: row.uses,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    active: row.active,
  };
}

export function useDiscounts() {
  return useQuery({
    queryKey: ["admin", "discounts"],
    queryFn: async (): Promise<Discount[]> => {
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as DiscountRow[]).map(mapDiscount);
    },
    staleTime: 60 * 1000,
  });
}

export type DiscountDraft = {
  id: string | null;
  code: string;
  description: string;
  kind: DiscountKind;
  value: number;
  minSubtotal: number;
  maxUses: number | null;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
};

export function emptyDiscountDraft(): DiscountDraft {
  return {
    id: null,
    code: "",
    description: "",
    kind: "percent",
    value: 10,
    minSubtotal: 0,
    maxUses: null,
    startsAt: null,
    endsAt: null,
    active: true,
  };
}

export function draftFromDiscount(discount: Discount): DiscountDraft {
  return {
    id: discount.id,
    code: discount.code,
    description: discount.description ?? "",
    kind: discount.kind,
    value: discount.value,
    minSubtotal: discount.minSubtotal,
    maxUses: discount.maxUses,
    // El input date quiere YYYY-MM-DD
    startsAt: discount.startsAt ? discount.startsAt.slice(0, 10) : null,
    endsAt: discount.endsAt ? discount.endsAt.slice(0, 10) : null,
    active: discount.active,
  };
}

export function useSaveDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: DiscountDraft) => {
      const row = {
        code: draft.code.trim().toUpperCase(),
        description: draft.description.trim() || null,
        kind: draft.kind,
        value: draft.kind === "free-shipping" ? 0 : draft.value,
        min_subtotal: draft.minSubtotal,
        max_uses: draft.maxUses,
        starts_at: draft.startsAt || null,
        // Hasta el final del día elegido (hora argentina), no hasta las 00:00
        ends_at: draft.endsAt ? `${draft.endsAt}T23:59:59-03:00` : null,
        active: draft.active,
      };

      const { error } = draft.id
        ? await supabase.from("discounts").update(row).eq("id", draft.id)
        : await supabase.from("discounts").insert(row);

      if (error) {
        if (error.code === "23505") throw new Error("Ya existe un cupón con ese código");
        throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "discounts"] });
    },
  });
}

export function useToggleDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("discounts")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "discounts"] });
    },
  });
}

export function useDeleteDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("discounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "discounts"] });
    },
  });
}
