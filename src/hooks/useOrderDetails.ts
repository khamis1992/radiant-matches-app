import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProductOrder } from "@/types/product";

export const useOrderDetails = (orderId: string) => {
  return useQuery({
    queryKey: ["orders", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error) throw error;
      return data as ProductOrder;
    },
    enabled: !!orderId,
  });
};
