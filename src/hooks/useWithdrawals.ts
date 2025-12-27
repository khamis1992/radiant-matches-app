import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WithdrawalRequest {
  id: string;
  artist_id: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "completed";
  bank_name: string | null;
  account_number: string | null;
  account_holder_name: string | null;
  notes: string | null;
  admin_notes: string | null;
  processed_at: string | null;
  created_at: string;
}

export interface CreateWithdrawalData {
  amount: number;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  notes?: string;
}

// جلب طلبات السحب للفنانة
export const useArtistWithdrawals = (artistId?: string) => {
  return useQuery({
    queryKey: ["artist-withdrawals", artistId],
    queryFn: async () => {
      if (!artistId) return [];

      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("artist_id", artistId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WithdrawalRequest[];
    },
    enabled: !!artistId,
  });
};

// إنشاء طلب سحب جديد
export const useCreateWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWithdrawalData & { artist_id: string }) => {
      const { data: withdrawal, error } = await supabase
        .from("withdrawal_requests")
        .insert({
          artist_id: data.artist_id,
          amount: data.amount,
          bank_name: data.bank_name,
          account_number: data.account_number,
          account_holder_name: data.account_holder_name,
          notes: data.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return withdrawal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["current-artist"] });
      toast.success("تم إرسال طلب السحب بنجاح");
    },
    onError: (error: Error) => {
      console.error("Withdrawal error:", error);
      toast.error("فشل في إرسال طلب السحب");
    },
  });
};

// جلب جميع طلبات السحب للمسؤول
export const useAdminWithdrawals = () => {
  return useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // جلب معلومات الفنانات
      const artistIds = [...new Set(data?.map((w) => w.artist_id) || [])];
      const artistsData = await Promise.all(
        artistIds.map(async (artistId) => {
          const { data: artist } = await supabase
            .from("artists")
            .select("id, user_id")
            .eq("id", artistId)
            .single();

          if (artist) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, email, phone")
              .eq("id", artist.user_id)
              .single();

            return { artistId, profile };
          }
          return { artistId, profile: null };
        })
      );

      const artistProfiles = Object.fromEntries(
        artistsData.map((a) => [a.artistId, a.profile])
      );

      return (data || []).map((w) => ({
        ...w,
        artist_profile: artistProfiles[w.artist_id],
      }));
    },
  });
};

// تحديث حالة طلب السحب (للمسؤول)
export const useUpdateWithdrawalStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      admin_notes,
    }: {
      id: string;
      status: "approved" | "rejected" | "completed";
      admin_notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({
          status,
          admin_notes,
          processed_by: user?.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["artist-withdrawals"] });
      toast.success("تم تحديث حالة الطلب");
    },
    onError: (error: Error) => {
      console.error("Update error:", error);
      toast.error("فشل في تحديث الطلب");
    },
  });
};

