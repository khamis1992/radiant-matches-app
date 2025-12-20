import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export type FavoriteItemType = "service" | "artist";

interface Favorite {
  id: string;
  user_id: string;
  item_type: FavoriteItemType;
  item_id: string;
  created_at: string;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as Favorite[];
    },
    enabled: !!user?.id,
  });

  const addFavorite = useMutation({
    mutationFn: async ({ itemType, itemId }: { itemType: FavoriteItemType; itemId: string }) => {
      if (!user?.id) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("favorites")
        .insert({
          user_id: user.id,
          item_type: itemType,
          item_id: itemId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
      toast({ title: "Added to favorites" });
    },
    onError: (error) => {
      console.error("Error adding favorite:", error);
      toast({ title: "Failed to add favorite", variant: "destructive" });
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async ({ itemType, itemId }: { itemType: FavoriteItemType; itemId: string }) => {
      if (!user?.id) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("item_type", itemType)
        .eq("item_id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
      toast({ title: "Removed from favorites" });
    },
    onError: (error) => {
      console.error("Error removing favorite:", error);
      toast({ title: "Failed to remove favorite", variant: "destructive" });
    },
  });

  const isFavorite = (itemType: FavoriteItemType, itemId: string): boolean => {
    return favorites.some(
      (fav) => fav.item_type === itemType && fav.item_id === itemId
    );
  };

  const toggleFavorite = (itemType: FavoriteItemType, itemId: string) => {
    if (!user?.id) {
      toast({ 
        title: "Please sign in", 
        description: "You need to be logged in to save favorites",
        variant: "destructive" 
      });
      return;
    }

    if (isFavorite(itemType, itemId)) {
      removeFavorite.mutate({ itemType, itemId });
    } else {
      addFavorite.mutate({ itemType, itemId });
    }
  };

  return {
    favorites,
    isLoading,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
  };
};
