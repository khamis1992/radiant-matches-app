import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const FEATURED_ARTIST_QUERY_KEY = ["featured-artist-selection"] as const;
const FEATURED_ARTIST_SETTING_KEY = "featured_artist_id";

export const useFeaturedArtistSelection = () =>
  useQuery({
    queryKey: FEATURED_ARTIST_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("value, updated_by, updated_at")
        .eq("key", FEATURED_ARTIST_SETTING_KEY)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const settingValue = data.value as { value?: unknown } | null;
      const artistId = typeof settingValue?.value === "string" ? settingValue.value : null;

      return artistId
        ? {
            artist_id: artistId,
            selected_by: data.updated_by,
            updated_at: data.updated_at,
          }
        : null;
    },
  });

export const useSetFeaturedArtist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (artistId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Authentication required");

      const { data, error } = await supabase
        .from("platform_settings")
        .upsert(
          {
            key: FEATURED_ARTIST_SETTING_KEY,
            value: { value: artistId },
            description: "Artist selected by an administrator for the featured showcase card",
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" },
        )
        .select("value, updated_by, updated_at")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEATURED_ARTIST_QUERY_KEY });
    },
  });
};

export const useClearFeaturedArtist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("platform_settings")
        .delete()
        .eq("key", FEATURED_ARTIST_SETTING_KEY);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEATURED_ARTIST_QUERY_KEY });
    },
  });
};
