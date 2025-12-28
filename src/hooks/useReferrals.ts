import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useReferrals = () => {
  const { user } = useAuth();

  const { data: referrals, isLoading } = useQuery({
    queryKey: ["referrals-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { data, error } = await supabase
        .from("referrals")
        .select("id")
        .eq("referrer_id", user.id);

      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!user?.id,
  });

  return { data: referrals || 0, isLoading };
};

