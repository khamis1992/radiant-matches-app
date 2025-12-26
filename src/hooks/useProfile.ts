import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
}

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
  });
};

export const useProfileStats = () => {
  return useQuery({
    queryKey: ["profile-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { bookings: 0, reviews: 0, favorites: 0 };
      
      const [bookingsResult, reviewsResult, favoritesResult] = await Promise.all([
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("customer_id", user.id),
        supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .eq("customer_id", user.id),
        supabase
          .from("favorites")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);
      
      return {
        bookings: bookingsResult.count || 0,
        reviews: reviewsResult.count || 0,
        favorites: favoritesResult.count || 0,
      };
    },
  });
};
