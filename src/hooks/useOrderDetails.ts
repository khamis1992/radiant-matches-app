import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProductOrder, ProductOrderItem, ShippingAddress } from "@/types/product";

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
      
      return {
        ...data,
        items: data.items as unknown as ProductOrderItem[],
        shipping_address: data.shipping_address as unknown as ShippingAddress | null,
        status: data.status as ProductOrder['status'],
      } as ProductOrder;
    },
    enabled: !!orderId,
  });
};
