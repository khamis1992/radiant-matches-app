import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminInvitation {
  id: string;
  email: string;
  role: "admin" | "artist";
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export const useAdminInvitations = () => {
  return useQuery({
    queryKey: ["admin-invitations"],
    queryFn: async (): Promise<AdminInvitation[]> => {
      const { data, error } = await supabase
        .from("admin_invitations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AdminInvitation[];
    },
  });
};

export const useSendInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      role,
      invitedBy,
    }: {
      email: string;
      role: "admin" | "artist";
      invitedBy: string;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "send-admin-invitation",
        {
          body: { email, role, invitedBy },
        }
      );

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invitations"] });
    },
  });
};

export const useDeleteInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("admin_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invitations"] });
    },
  });
};

export const useAcceptInvitation = () => {
  return useMutation({
    mutationFn: async (token: string) => {
      // Get the invitation
      const { data: invitation, error: fetchError } = await supabase
        .from("admin_invitations")
        .select("*")
        .eq("token", token)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (fetchError || !invitation) {
        throw new Error("الدعوة غير صالحة أو منتهية الصلاحية");
      }

      return invitation as AdminInvitation;
    },
  });
};
