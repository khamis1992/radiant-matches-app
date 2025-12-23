import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminService {
  id: string;
  artist_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  category: string | null;
  image_url: string | null;
  is_active: boolean | null;
  created_at: string;
  artist_profile?: {
    full_name: string | null;
  } | null;
}

export const useAdminServices = () => {
  const queryClient = useQueryClient();

  const servicesQuery = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      // Fetch all services (active and inactive for admin)
      const { data: services, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });

      if (servicesError) throw servicesError;
      if (!services || services.length === 0) return [];

      // Fetch artist profiles
      const artistIds = [...new Set(services.map((s) => s.artist_id))];
      const { data: artists, error: artistsError } = await supabase
        .from("artists")
        .select("id, user_id")
        .in("id", artistIds);

      if (artistsError) throw artistsError;

      const artistUserIds = artists?.map((a) => a.user_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", artistUserIds);

      if (profilesError) throw profilesError;

      // Create maps
      const artistUserMap = new Map(artists?.map((a) => [a.id, a.user_id]) || []);
      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return services.map((service) => {
        const artistUserId = artistUserMap.get(service.artist_id);
        return {
          ...service,
          artist_profile: artistUserId ? profileMap.get(artistUserId) : null,
        };
      }) as AdminService[];
    },
  });

  const toggleServiceStatusMutation = useMutation({
    mutationFn: async ({ serviceId, isActive }: { serviceId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("services")
        .update({ is_active: isActive })
        .eq("id", serviceId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      toast.success(variables.isActive ? "تم تفعيل الخدمة" : "تم تعطيل الخدمة");
    },
    onError: (error) => {
      console.error("Error toggling service status:", error);
      toast.error("حدث خطأ أثناء تحديث الخدمة");
    },
  });

  const updateServicePriceMutation = useMutation({
    mutationFn: async ({ serviceId, price }: { serviceId: string; price: number }) => {
      const { error } = await supabase
        .from("services")
        .update({ price })
        .eq("id", serviceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      toast.success("تم تحديث السعر بنجاح");
    },
    onError: (error) => {
      console.error("Error updating service price:", error);
      toast.error("حدث خطأ أثناء تحديث السعر");
    },
  });

  return {
    services: servicesQuery.data || [],
    isLoading: servicesQuery.isLoading,
    error: servicesQuery.error,
    toggleServiceStatus: toggleServiceStatusMutation.mutate,
    updateServicePrice: updateServicePriceMutation.mutate,
    isUpdating: toggleServiceStatusMutation.isPending || updateServicePriceMutation.isPending,
  };
};
