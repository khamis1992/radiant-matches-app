/**
 * Unified Cart Hook
 * Handles both local storage cart (for guests) and backend cart (for logged-in users)
 * Automatically merges local cart into backend on login
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { CartItem, Product } from "@/types/product";
import {
  getLocalCart,
  addToLocalCart,
  updateLocalCartItem,
  removeFromLocalCart,
  clearLocalCart,
  getLocalCartCount,
  type LocalCartItem,
} from "./useLocalCart";

// Fetch product details for local cart items
const fetchProductsForLocalCart = async (localCart: LocalCartItem[]): Promise<CartItem[]> => {
  if (localCart.length === 0) return [];

  const productIds = localCart.map((item) => item.product_id);
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .in("id", productIds)
    .eq("is_active", true);

  if (error) throw error;

  return localCart
    .map((item) => {
      const product = products?.find((p) => p.id === item.product_id);
      if (!product) return null;
      return {
        id: `local-${item.product_id}`,
        user_id: "guest",
        product_id: item.product_id,
        quantity: item.quantity,
        created_at: item.added_at,
        product: product as Product,
      } as CartItem;
    })
    .filter(Boolean) as CartItem[];
};

// Merge local cart into backend cart
const mergeLocalCartToBackend = async (userId: string): Promise<void> => {
  const localCart = getLocalCart();
  if (localCart.length === 0) return;

  // Process each item
  for (const item of localCart) {
    // Check if item already exists in backend cart
    const { data: existing } = await supabase
      .from("shopping_cart")
      .select("id, quantity")
      .eq("user_id", userId)
      .eq("product_id", item.product_id)
      .single();

    if (existing) {
      // Update quantity
      await supabase
        .from("shopping_cart")
        .update({ quantity: existing.quantity + item.quantity })
        .eq("id", existing.id);
    } else {
      // Insert new item
      await supabase.from("shopping_cart").insert({
        user_id: userId,
        product_id: item.product_id,
        quantity: item.quantity,
      });
    }
  }

  // Clear local cart after successful merge
  clearLocalCart();
};

export const useUnifiedCart = () => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [mergeCompleted, setMergeCompleted] = useState(false);

  // Merge local cart when user logs in
  useEffect(() => {
    const performMerge = async () => {
      if (user && !mergeCompleted) {
        const localCart = getLocalCart();
        if (localCart.length > 0) {
          try {
            await mergeLocalCartToBackend(user.id);
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            queryClient.invalidateQueries({ queryKey: ["cart", "count"] });
          } catch (error) {
            console.error("Failed to merge local cart:", error);
          }
        }
        setMergeCompleted(true);
      }
    };

    if (!authLoading) {
      performMerge();
    }
  }, [user, authLoading, mergeCompleted, queryClient]);

  // Reset merge flag when user logs out
  useEffect(() => {
    if (!user && mergeCompleted) {
      setMergeCompleted(false);
    }
  }, [user, mergeCompleted]);

  // Main cart query - returns local or backend cart based on auth status
  const cartQuery = useQuery({
    queryKey: ["cart", user?.id || "guest"],
    queryFn: async () => {
      if (user) {
        // Fetch backend cart
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
      } else {
        // Return local cart with product details
        const localCart = getLocalCart();
        return fetchProductsForLocalCart(localCart);
      }
    },
    enabled: !authLoading,
  });

  // Cart count query
  const countQuery = useQuery({
    queryKey: ["cart", "count", user?.id || "guest"],
    queryFn: async () => {
      if (user) {
        const { data, error } = await supabase
          .from("shopping_cart")
          .select("quantity")
          .eq("user_id", user.id);

        if (error) throw error;
        return data.reduce((sum, item) => sum + item.quantity, 0);
      } else {
        return getLocalCartCount();
      }
    },
    enabled: !authLoading,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
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

      if (user) {
        // Backend cart
        const { data: existing } = await supabase
          .from("shopping_cart")
          .select("id, quantity")
          .eq("user_id", user.id)
          .eq("product_id", productId)
          .single();

        if (existing) {
          const { data, error } = await supabase
            .from("shopping_cart")
            .update({ quantity: existing.quantity + quantity })
            .eq("id", existing.id)
            .select(`*, product:products(*)`)
            .single();

          if (error) throw error;
          return { ...data, product: data.product as Product } as CartItem;
        } else {
          const { data, error } = await supabase
            .from("shopping_cart")
            .insert({
              user_id: user.id,
              product_id: productId,
              quantity,
            })
            .select(`*, product:products(*)`)
            .single();

          if (error) throw error;
          return { ...data, product: data.product as Product } as CartItem;
        }
      } else {
        // Local cart
        addToLocalCart(productId, quantity);
        const localCart = getLocalCart();
        const items = await fetchProductsForLocalCart(localCart);
        return items.find((i) => i.product_id === productId) || null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart", "count"] });
    },
  });

  // Update cart item mutation
  const updateCartItemMutation = useMutation({
    mutationFn: async ({
      cartItemId,
      productId,
      quantity,
    }: {
      cartItemId: string;
      productId?: string;
      quantity: number;
    }) => {
      if (user) {
        // Backend cart
        if (quantity <= 0) {
          const { error } = await supabase.from("shopping_cart").delete().eq("id", cartItemId);
          if (error) throw error;
          return null;
        }

        const { data, error } = await supabase
          .from("shopping_cart")
          .update({ quantity })
          .eq("id", cartItemId)
          .select(`*, product:products(*)`)
          .single();

        if (error) throw error;
        return { ...data, product: data.product as Product } as CartItem;
      } else {
        // Local cart
        if (productId) {
          updateLocalCartItem(productId, quantity);
        }
        return null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart", "count"] });
    },
  });

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async ({ cartItemId, productId }: { cartItemId: string; productId?: string }) => {
      if (user) {
        const { error } = await supabase.from("shopping_cart").delete().eq("id", cartItemId);
        if (error) throw error;
      } else {
        if (productId) {
          removeFromLocalCart(productId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart", "count"] });
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (user) {
        const { error } = await supabase.from("shopping_cart").delete().eq("user_id", user.id);
        if (error) throw error;
      } else {
        clearLocalCart();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart", "count"] });
    },
  });

  return {
    // Data
    cartItems: cartQuery.data || [],
    cartCount: countQuery.data || 0,
    isLoading: cartQuery.isLoading || authLoading,
    isGuest: !user,

    // Mutations
    addToCart: addToCartMutation,
    updateCartItem: updateCartItemMutation,
    removeFromCart: removeFromCartMutation,
    clearCart: clearCartMutation,

    // Refetch
    refetchCart: cartQuery.refetch,
  };
};

// Re-export for backward compatibility
export {
  getLocalCart,
  addToLocalCart,
  updateLocalCartItem,
  removeFromLocalCart,
  clearLocalCart,
  getLocalCartCount,
};
