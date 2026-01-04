import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Product {
  id: string;
  artist_id: string;
  title: string;
  description: string | null;
  product_type: "physical" | "digital" | "bundle" | "gift_card";
  category: string;
  price_qar: number;
  compare_at_price: number | null;
  images: string[];
  inventory_count: number;
  digital_content_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductInsert {
  title: string;
  description?: string;
  product_type: "physical" | "digital" | "bundle" | "gift_card";
  category: string;
  price_qar: number;
  compare_at_price?: number;
  images?: string[];
  inventory_count?: number;
  digital_content_url?: string;
  is_active?: boolean;
  is_featured?: boolean;
}

export interface ProductUpdate extends Partial<ProductInsert> {
  id: string;
}

// Get current artist's products
export const useArtistProducts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["artist-products", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First get the artist ID
      const { data: artist, error: artistError } = await supabase
        .from("artists")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (artistError || !artist) return [];

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("artist_id", artist.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((p) => ({
        ...p,
        images: Array.isArray(p.images) ? p.images : [],
      })) as Product[];
    },
    enabled: !!user?.id,
  });
};

// Add a new product
export const useAddProduct = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: ProductInsert) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Get artist ID
      const { data: artist, error: artistError } = await supabase
        .from("artists")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (artistError || !artist) throw new Error("Artist not found");

      const { data, error } = await supabase
        .from("products")
        .insert({
          artist_id: artist.id,
          title: product.title,
          description: product.description || null,
          product_type: product.product_type,
          category: product.category,
          price_qar: product.price_qar,
          compare_at_price: product.compare_at_price || null,
          images: product.images || [],
          inventory_count: product.inventory_count || 0,
          digital_content_url: product.digital_content_url || null,
          is_active: product.is_active ?? true,
          is_featured: product.is_featured ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-products"] });
    },
  });
};

// Update a product
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ProductUpdate) => {
      const { data, error } = await supabase
        .from("products")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-products"] });
    },
  });
};

// Delete a product
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-products"] });
    },
  });
};

// Upload product image
export const useUploadProductImage = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Get artist ID first - required for RLS policy
      const { data: artist, error: artistError } = await supabase
        .from("artists")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (artistError || !artist) throw new Error("Artist not found");

      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      // Use artist ID as folder name to match RLS policy
      const filePath = `${artist.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("portfolio").getPublicUrl(filePath);
      return data.publicUrl;
    },
  });
};
