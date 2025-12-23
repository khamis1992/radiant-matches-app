import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  button_text: string | null;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface CreateBannerData {
  title: string;
  subtitle?: string;
  button_text?: string;
  image_url: string;
  link_url?: string;
  is_active?: boolean;
  display_order?: number;
}

interface UpdateBannerData extends Partial<CreateBannerData> {
  id: string;
}

export const useAdminBanners = () => {
  const queryClient = useQueryClient();

  const { data: banners = [], isLoading, error } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Banner[];
    },
  });

  const createBanner = useMutation({
    mutationFn: async (bannerData: CreateBannerData) => {
      const { data, error } = await supabase
        .from("banners")
        .insert(bannerData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      queryClient.invalidateQueries({ queryKey: ["active-banners"] });
      toast.success("تم إضافة البنر بنجاح");
    },
    onError: (error: Error) => {
      toast.error("فشل في إضافة البنر: " + error.message);
    },
  });

  const updateBanner = useMutation({
    mutationFn: async ({ id, ...bannerData }: UpdateBannerData) => {
      const { data, error } = await supabase
        .from("banners")
        .update(bannerData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      queryClient.invalidateQueries({ queryKey: ["active-banners"] });
      toast.success("تم تحديث البنر بنجاح");
    },
    onError: (error: Error) => {
      toast.error("فشل في تحديث البنر: " + error.message);
    },
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("banners")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      queryClient.invalidateQueries({ queryKey: ["active-banners"] });
      toast.success("تم حذف البنر بنجاح");
    },
    onError: (error: Error) => {
      toast.error("فشل في حذف البنر: " + error.message);
    },
  });

  const toggleBannerStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from("banners")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      queryClient.invalidateQueries({ queryKey: ["active-banners"] });
      toast.success("تم تحديث حالة البنر");
    },
    onError: (error: Error) => {
      toast.error("فشل في تحديث حالة البنر: " + error.message);
    },
  });

  const reorderBanners = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => 
        supabase
          .from("banners")
          .update({ display_order: index })
          .eq("id", id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      queryClient.invalidateQueries({ queryKey: ["active-banners"] });
      toast.success("تم إعادة ترتيب البنرات");
    },
    onError: (error: Error) => {
      toast.error("فشل في إعادة ترتيب البنرات: " + error.message);
    },
  });

  const uploadBannerImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("banners")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("banners")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  return {
    banners,
    isLoading,
    error,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
    reorderBanners,
    uploadBannerImage,
  };
};

// Hook for public banners (active only)
export const useActiveBanners = () => {
  return useQuery({
    queryKey: ["active-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Banner[];
    },
  });
};
