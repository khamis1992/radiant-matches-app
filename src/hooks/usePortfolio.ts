import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PortfolioItem {
  id: string;
  artist_id: string;
  image_url: string;
  category: string;
  title: string | null;
  display_order: number;
  created_at: string;
}

export const PORTFOLIO_CATEGORIES = [
  "Bridal",
  "Party",
  "Editorial",
  "Natural",
  "Special FX",
  "Photoshoot",
  "General",
] as const;

export type PortfolioCategory = typeof PORTFOLIO_CATEGORIES[number];

export const useArtistPortfolio = (artistId: string | undefined) => {
  return useQuery({
    queryKey: ["portfolio", artistId],
    queryFn: async () => {
      if (!artistId) return [];
      
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("artist_id", artistId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as PortfolioItem[];
    },
    enabled: !!artistId,
  });
};

export const useAddPortfolioItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Omit<PortfolioItem, "id" | "created_at" | "display_order"> & { display_order?: number }) => {
      const { data, error } = await supabase
        .from("portfolio_items")
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["portfolio", variables.artist_id] });
    },
  });
};

export const useReorderPortfolio = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ artistId, items }: { artistId: string; items: { id: string; display_order: number }[] }) => {
      // Update each item's display_order
      const updates = items.map(item => 
        supabase
          .from("portfolio_items")
          .update({ display_order: item.display_order })
          .eq("id", item.id)
      );
      
      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["portfolio", variables.artistId] });
    },
  });
};

export const useUpdatePortfolioItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, artistId, ...updates }: { id: string; artistId: string; category?: string; title?: string }) => {
      const { data, error } = await supabase
        .from("portfolio_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["portfolio", variables.artistId] });
    },
  });
};

export const useDeletePortfolioItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, artistId, imageUrl }: { id: string; artistId: string; imageUrl: string }) => {
      // Delete from database
      const { error } = await supabase
        .from("portfolio_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Try to delete from storage
      const urlParts = imageUrl.split("/portfolio/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from("portfolio").remove([filePath]);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["portfolio", variables.artistId] });
    },
  });
};
