import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BlockedDate {
  id: string;
  artist_id: string;
  blocked_date: string;
  reason: string | null;
  created_at: string;
}

export const useBlockedDates = (artistId: string | undefined) => {
  return useQuery({
    queryKey: ["blocked-dates", artistId],
    queryFn: async () => {
      if (!artistId) return [];

      const { data, error } = await supabase
        .from("artist_blocked_dates")
        .select("*")
        .eq("artist_id", artistId)
        .order("blocked_date", { ascending: true });

      if (error) throw error;
      return data as BlockedDate[];
    },
    enabled: !!artistId,
  });
};

export const useAddBlockedDate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      artistId,
      date,
      reason,
    }: {
      artistId: string;
      date: Date;
      reason?: string;
    }) => {
      const { error } = await supabase.from("artist_blocked_dates").insert({
        artist_id: artistId,
        blocked_date: date.toISOString().split("T")[0],
        reason: reason || null,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["blocked-dates", variables.artistId],
      });
    },
  });
};

export const useRemoveBlockedDate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      blockedDateId,
      artistId,
    }: {
      blockedDateId: string;
      artistId: string;
    }) => {
      const { error } = await supabase
        .from("artist_blocked_dates")
        .delete()
        .eq("id", blockedDateId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["blocked-dates", variables.artistId],
      });
    },
  });
};
