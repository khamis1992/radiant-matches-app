import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "admin" | "customer" | "artist";

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user) {
        return { role: null as AppRole | null, isArtist: false };
      }

      const { data: rolesData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching user role:", error);
        return { role: "customer" as AppRole, isArtist: false };
      }

      const roles = (rolesData || []).map((r) => r.role as AppRole);
      const hasArtistRole = roles.includes("artist");
      const hasAdminRole = roles.includes("admin");

      // Priority: admin > artist > customer
      const primaryRole = hasAdminRole ? "admin" : hasArtistRole ? "artist" : "customer";

      return { role: primaryRole, isArtist: hasArtistRole };
    },
    enabled: !authLoading && !!user,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  });

  // When user is null (logged out), return immediately without loading
  if (!authLoading && !user) {
    return { role: null, isArtist: false, loading: false };
  }

  return {
    role: data?.role ?? null,
    isArtist: data?.isArtist ?? false,
    loading: authLoading || isLoading,
  };
};
