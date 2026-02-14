import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { invalidateRoleCache } from "./useUserRole";

export interface AdminUser {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  location: string | null;
  created_at: string;
  roles: string[];
  bookings_count: number;
}

export const useAdminUsers = (search?: string) => {
  return useQuery({
    queryKey: ["admin-users", search],
    queryFn: async (): Promise<AdminUser[]> => {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data: profiles, error } = await query;
      if (error) throw error;

      // Fetch roles and bookings count for each user
      const enrichedUsers = await Promise.all(
        (profiles || []).map(async (profile) => {
          const [rolesResult, bookingsResult] = await Promise.all([
            supabase.from("user_roles").select("role").eq("user_id", profile.id),
            supabase
              .from("bookings")
              .select("id", { count: "exact", head: true })
              .eq("customer_id", profile.id),
          ]);

          return {
            ...profile,
            roles: (rolesResult.data || []).map((r) => r.role),
            bookings_count: bookingsResult.count || 0,
          };
        })
      );

      return enrichedUsers;
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "artist" | "customer";
    }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Session expired. Please sign in again.");
      }

      const response = await supabase.functions.invoke("admin-update-role", {
        body: { userId, role },
      });

      if (response.error) {
        const message = response.error.message || "Unknown error";
        if (message.includes("401") || message.toLowerCase().includes("unauthorized")) {
          await supabase.auth.signOut();
          throw new Error("Session expired. Please sign in again.");
        }
        throw new Error(message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate the role cache for the updated user
      invalidateRoleCache(variables.userId);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-artists"] });
      queryClient.invalidateQueries({ queryKey: ["user-role"] });
    },
  });
};
