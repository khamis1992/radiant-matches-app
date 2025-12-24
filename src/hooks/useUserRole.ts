import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "admin" | "customer" | "artist";

// Simple in-memory cache to persist role across component remounts
const roleCache: { [userId: string]: { role: AppRole; isArtist: boolean } } = {};

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(() => {
    // Initialize from cache if available
    if (user?.id && roleCache[user.id]) {
      return roleCache[user.id].role;
    }
    return null;
  });
  const [isArtist, setIsArtist] = useState(() => {
    if (user?.id && roleCache[user.id]) {
      return roleCache[user.id].isArtist;
    }
    return false;
  });
  const [loading, setLoading] = useState(() => {
    // Don't show loading if we have cached data
    if (user?.id && roleCache[user.id]) {
      return false;
    }
    return true;
  });
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setIsArtist(false);
        setLoading(false);
        lastUserId.current = null;
        return;
      }

      // If we have cached data for this user, use it immediately
      if (roleCache[user.id]) {
        setRole(roleCache[user.id].role);
        setIsArtist(roleCache[user.id].isArtist);
        setLoading(false);
        
        // Only refetch if user changed
        if (lastUserId.current === user.id) {
          return;
        }
      }

      lastUserId.current = user.id;

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
        
        // Cache the result
        roleCache[user.id] = { role: primaryRole, isArtist: hasArtistRole };
        
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

// Export a function to invalidate the cache when role changes
export const invalidateRoleCache = (userId?: string) => {
  if (userId) {
    delete roleCache[userId];
  } else {
    Object.keys(roleCache).forEach(key => delete roleCache[key]);
  }
};
