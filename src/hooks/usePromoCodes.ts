import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PromoCode {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  min_order_amount: number;
  created_by: string | null;
  created_at: string;
}

export interface CreatePromoCodeData {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  min_order_amount?: number;
}

export const usePromoCodes = () => {
  return useQuery({
    queryKey: ["admin-promo-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PromoCode[];
    },
  });
};

export const useCreatePromoCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (promoData: CreatePromoCodeData) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("promo_codes")
        .insert({
          ...promoData,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      toast.success("تم إنشاء كود الخصم بنجاح");
    },
    onError: (error: Error) => {
      console.error("Error creating promo code:", error);
      if (error.message.includes("duplicate")) {
        toast.error("كود الخصم موجود مسبقاً");
      } else {
        toast.error("فشل في إنشاء كود الخصم");
      }
    },
  });
};

export const useUpdatePromoCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PromoCode> & { id: string }) => {
      const { data, error } = await supabase
        .from("promo_codes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      toast.success("تم تحديث كود الخصم بنجاح");
    },
    onError: (error: Error) => {
      console.error("Error updating promo code:", error);
      toast.error("فشل في تحديث كود الخصم");
    },
  });
};

export const useDeletePromoCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("promo_codes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      toast.success("تم حذف كود الخصم بنجاح");
    },
    onError: (error: Error) => {
      console.error("Error deleting promo code:", error);
      toast.error("فشل في حذف كود الخصم");
    },
  });
};

export const useTogglePromoCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from("promo_codes")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      toast.success(variables.is_active ? "تم تفعيل كود الخصم" : "تم إلغاء تفعيل كود الخصم");
    },
    onError: (error: Error) => {
      console.error("Error toggling promo code:", error);
      toast.error("فشل في تغيير حالة كود الخصم");
    },
  });
};
