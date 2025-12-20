import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Service {
  id: string;
  artist_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  category: string | null;
  image_url: string | null;
  is_active: boolean | null;
}

export const useArtistServices = (artistId: string | undefined) => {
  return useQuery({
    queryKey: ["services", artistId],
    queryFn: async () => {
      if (!artistId) return [];
      
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("artist_id", artistId)
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) throw error;
      return data as Service[];
    },
    enabled: !!artistId,
  });
};
