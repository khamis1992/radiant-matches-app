import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BlockedIp {
  id: string;
  ip_address: string;
  reason: string | null;
  blocked_by: string | null;
  blocked_user_id: string | null;
  is_active: boolean;
  created_at: string;
}

export const useBlockedIps = () => {
  return useQuery({
    queryKey: ["blocked-ips"],
    queryFn: async (): Promise<BlockedIp[]> => {
      const { data, error } = await supabase.functions.invoke("manage-blocked-ip", {
        body: { action: "list" },
      });
      if (error) throw error;
      return data?.data || [];
    },
  });
};

export const useBlockIp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ip_address, reason, blocked_user_id }: { ip_address: string; reason?: string; blocked_user_id?: string }) => {
      const { data, error } = await supabase.functions.invoke("manage-blocked-ip", {
        body: { action: "block", ip_address, reason, blocked_user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blocked-ips"] }),
  });
};

export const useUnblockIp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (block_id: string) => {
      const { data, error } = await supabase.functions.invoke("manage-blocked-ip", {
        body: { action: "unblock", block_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blocked-ips"] }),
  });
};

export const useDeleteBlockedIp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (block_id: string) => {
      const { data, error } = await supabase.functions.invoke("manage-blocked-ip", {
        body: { action: "delete", block_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blocked-ips"] }),
  });
};

export const checkBlockedIp = async (): Promise<{ blocked: boolean; ip: string; reason?: string; country_code?: string | null }> => {
  try {
    const { data, error } = await supabase.functions.invoke("check-blocked-ip");
    if (error) return { blocked: false, ip: "unknown" };
    return data || { blocked: false, ip: "unknown" };
  } catch {
    return { blocked: false, ip: "unknown" };
  }
};
