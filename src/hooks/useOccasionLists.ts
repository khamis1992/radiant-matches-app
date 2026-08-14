import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trackProductEvent } from "@/lib/productAnalytics";

export const useOccasionLists = () => {
  return useQuery({
    queryKey: ["occasion-lists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("occasion_lists")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreateOccasionList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("not_authenticated");
      const { data, error } = await supabase
        .from("occasion_lists")
        .insert({ user_id: auth.user.id, title })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (list) => {
      void trackProductEvent("occasion_search", { occasion_list_id: list.id, source: "favorites" });
      queryClient.invalidateQueries({ queryKey: ["occasion-lists"] });
    },
  });
};

export const useAddArtistToOccasionList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ occasionListId, artistId }: { occasionListId: string; artistId: string }) => {
      const { error } = await supabase
        .from("occasion_list_items")
        .upsert({ occasion_list_id: occasionListId, artist_id: artistId }, { onConflict: "occasion_list_id,artist_id" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["occasion-lists"] }),
  });
};
