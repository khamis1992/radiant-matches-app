import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const queryKey = ["favorites", user?.id] as const;

  const { data: favorites = [], isLoading } = useQuery({
    queryKey,
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

  // Optimistic toggle: update the cache instantly, roll back on failure
  const toggleMutation = useMutation({
    mutationFn: async ({
      itemType,
      itemId,
      action,
    }: {
      itemType: FavoriteItemType;
      itemId: string;
      action: "add" | "remove";
    }) => {
      if (!user?.id) throw new Error("Must be logged in");

      if (action === "add") {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, item_type: itemType, item_id: itemId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("item_type", itemType)
          .eq("item_id", itemId);
        if (error) throw error;
      }
    },
    onMutate: async ({ itemType, itemId, action }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Favorite[]>(queryKey);

      queryClient.setQueryData<Favorite[]>(queryKey, (old = []) => {
        if (action === "add") {
          return [
            ...old,
            {
              id: `optimistic-${itemId}`,
              user_id: user!.id,
              item_type: itemType,
              item_id: itemId,
              created_at: new Date().toISOString(),
            },
          ];
        }
        return old.filter((f) => !(f.item_type === itemType && f.item_id === itemId));
      });

      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      console.error("Error toggling favorite:", error);
      toast.error(language === "ar" ? "فشل تحديث المفضلة" : "Failed to update favorites");
    },
    onSuccess: (_data, { action }) => {
      toast.success(
        action === "add"
          ? language === "ar"
            ? "تمت الإضافة إلى المفضلة"
            : "Added to favorites"
          : language === "ar"
            ? "تمت الإزالة من المفضلة"
            : "Removed from favorites"
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const isFavorite = (itemType: FavoriteItemType, itemId: string): boolean => {
    return favorites.some(
      (fav) => fav.item_type === itemType && fav.item_id === itemId
    );
  };

  const toggleFavorite = (itemType: FavoriteItemType, itemId: string) => {
    if (!user?.id) {
      toast.error(
        language === "ar" ? "يرجى تسجيل الدخول" : "Please sign in",
        {
          description:
            language === "ar"
              ? "تحتاج لتسجيل الدخول لحفظ المفضلة"
              : "You need to be logged in to save favorites",
        }
      );
      return;
    }

    toggleMutation.mutate({
      itemType,
      itemId,
      action: isFavorite(itemType, itemId) ? "remove" : "add",
    });
  };

  // Backwards-compatible mutation-shaped API for existing callers
  const addFavorite = {
    mutate: (vars: { itemType: FavoriteItemType; itemId: string }) =>
      toggleMutation.mutate({ ...vars, action: "add" }),
    isPending: toggleMutation.isPending,
  };
  const removeFavorite = {
    mutate: (vars: { itemType: FavoriteItemType; itemId: string }) =>
      toggleMutation.mutate({ ...vars, action: "remove" }),
    isPending: toggleMutation.isPending,
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
