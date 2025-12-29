import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ActivityLogEntry {
  id: string;
  action: string;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export const useActivityLog = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["activity-log"],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

