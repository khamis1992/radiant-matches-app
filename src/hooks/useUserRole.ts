import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "admin" | "customer" | "artist";

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isArtist, setIsArtist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setIsArtist(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching user role:", error);
        }

        const roles = (data || []).map((r) => r.role as AppRole);
        const hasArtistRole = roles.includes("artist");
        const hasAdminRole = roles.includes("admin");
        
        // Priority: admin > artist > customer
        const primaryRole = hasAdminRole ? "admin" : hasArtistRole ? "artist" : "customer";
        setRole(primaryRole);
        setIsArtist(hasArtistRole);
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole("customer");
        setIsArtist(false);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchRole();
    }
  }, [user, authLoading]);

  return { role, isArtist, loading: authLoading || loading };
};
