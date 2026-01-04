import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import type { ProductOrder, ProductOrderItem, ShippingAddress } from "@/types/product";

export type ProductOrderType = Tables<"product_orders">;
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
      return (data || []).map(order => ({
        ...order,
        items: order.items as unknown as ProductOrderItem[],
        shipping_address: order.shipping_address as unknown as ShippingAddress | null,
        status: order.status as ProductOrder['status'],
      })) as ProductOrder[];
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

export const useCustomerOrders = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["customer-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("product_orders")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(order => ({
        ...order,
        items: order.items as unknown as ProductOrderItem[],
        shipping_address: order.shipping_address as unknown as ShippingAddress | null,
        status: order.status as ProductOrder['status'],
      })) as ProductOrder[];
    },
    enabled: !!user,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (orderData: {
      items: ProductOrderItem[];
      shipping_address: ShippingAddress | null;
      total_qar: number;
    }) => {
      if (!user) throw new Error("User not authenticated");

      // Get artist_id from the first product
      const { data: productData } = await supabase
        .from("products")
        .select("artist_id")
        .eq("id", orderData.items[0]?.product_id)
        .single();

      const { data, error } = await supabase
        .from("product_orders")
        .insert({
          customer_id: user.id,
          artist_id: productData?.artist_id || user.id,
          items: JSON.parse(JSON.stringify(orderData.items)),
          shipping_address: orderData.shipping_address ? JSON.parse(JSON.stringify(orderData.shipping_address)) : null,
          total_qar: orderData.total_qar,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      queryClient.invalidateQueries({ queryKey: ["product-orders"] });
      queryClient.invalidateQueries({ queryKey: ["shopping-cart"] });
    },
  });
};
