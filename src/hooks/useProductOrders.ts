import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type ProductOrder = Tables<"product_orders">;
export type ProductOrderUpdate = TablesUpdate<"product_orders">;

export const useProductOrders = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["product-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("product_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProductOrder[];
    },
    enabled: !!user,
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, trackingNumber }: { orderId: string; status: string; trackingNumber?: string }) => {
      const updateData: ProductOrderUpdate = { status };
      if (trackingNumber !== undefined) {
        updateData.tracking_number = trackingNumber;
      }

      const { data, error } = await supabase
        .from("product_orders")
        .update(updateData)
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-orders"] });
    },
  });
};

export const useOrderStats = () => {
  const { data: orders = [] } = useProductOrders();

  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === "pending").length,
    processingOrders: orders.filter((o) => o.status === "processing").length,
    shippedOrders: orders.filter((o) => o.status === "shipped").length,
    deliveredOrders: orders.filter((o) => o.status === "delivered").length,
    cancelledOrders: orders.filter((o) => o.status === "cancelled").length,
    totalRevenue: orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total_qar), 0),
  };

  return stats;
};
