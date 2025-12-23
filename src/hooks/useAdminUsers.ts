import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      action,
    }: {
      userId: string;
      role: "admin" | "artist" | "customer";
      action: "add" | "remove";
    }) => {
      if (action === "add") {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (error) throw error;

        // If adding artist role, create artist profile
        if (role === "artist") {
          const { data: existingArtist } = await supabase
            .from("artists")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();

          if (!existingArtist) {
            const { error: artistError } = await supabase
              .from("artists")
              .insert({ user_id: userId });
            if (artistError) throw artistError;
          }
        }
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-artists"] });
    },
  });
};
