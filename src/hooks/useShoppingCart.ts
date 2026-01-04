import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CartItem, Product } from "@/types/product";

export const useShoppingCart = () => {
  return useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("shopping_cart")
        .select(`
          *,
          product:products(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((item: any) => ({
        ...item,
        product: item.product as Product,
      })) as CartItem[];
    },
  });
};

export const useCartItemCount = () => {
  return useQuery({
    queryKey: ["cart", "count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase
        .from("shopping_cart")
        .select("quantity")
        .eq("user_id", user.id);

      if (error) throw error;

      return data.reduce((sum, item) => sum + item.quantity, 0);
    },
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if product exists and is active
      const { data: product } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("is_active", true)
        .single();

      if (!product) throw new Error("Product not available");

      // Check inventory for physical products
      if (product.product_type === "physical" && product.inventory_count < quantity) {
        throw new Error("Not enough inventory");
      }

      const { data, error } = await supabase
        .from("shopping_cart")
        .upsert(
          {
            user_id: user.id,
            product_id: productId,
            quantity,
          },
          {
            onConflict: "user_id,product_id",
            ignoreDuplicates: false,
          }
        )
        .select(`
          *,
          product:products(*)
        `)
        .single();

      // For upsert with quantity increment
      if (error && error.code === "23505") {
        // Unique violation - update quantity
        const { data: updated } = await supabase
          .from("shopping_cart")
          .update({ quantity: supabase.raw(`quantity + ${quantity}`) })
          .eq("user_id", user.id)
          .eq("product_id", productId)
          .select(`
            *,
            product:products(*)
          `)
          .single();

        return { ...updated, product: updated.product as Product } as CartItem;
      }

      if (error) throw error;

      return { ...data, product: data.product as Product } as CartItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart", "count"] });
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase
          .from("shopping_cart")
          .delete()
          .eq("id", cartItemId);

        if (error) throw error;
        return null;
      }

      const { data, error } = await supabase
        .from("shopping_cart")
        .update({ quantity })
        .eq("id", cartItemId)
        .select(`
          *,
          product:products(*)
        `)
        .single();

      if (error) throw error;

      return { ...data, product: data.product as Product } as CartItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart", "count"] });
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cartItemId: string) => {
      const { error } = await supabase
        .from("shopping_cart")
        .delete()
        .eq("id", cartItemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart", "count"] });
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("shopping_cart")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart", "count"] });
    },
  });
};
