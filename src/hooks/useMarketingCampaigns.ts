import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MarketingCampaign {
  id: string;
  title: string;
  description: string | null;
  type: "discount" | "promo_code" | "banner" | "push_notification" | "email";
  status: "draft" | "scheduled" | "active" | "paused" | "completed" | "cancelled";
  discount_percent: number | null;
  discount_amount: number | null;
  promo_code: string | null;
  min_order_amount: number | null;
  max_uses: number | null;
  current_uses: number;
  target_audience: "all" | "new_users" | "returning_users" | "inactive_users" | "high_value";
  target_services: string[] | null;
  start_date: string | null;
  end_date: string | null;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue_generated: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignInput {
  title: string;
  description?: string;
  type: MarketingCampaign["type"];
  discount_percent?: number;
  discount_amount?: number;
  promo_code?: string;
  min_order_amount?: number;
  max_uses?: number;
  target_audience?: MarketingCampaign["target_audience"];
  target_services?: string[];
  start_date?: string;
  end_date?: string;
}

/**
 * Hook for managing marketing campaigns
 * Used by admins to create, update, and analyze promotional campaigns
 */
export const useMarketingCampaigns = () => {
  const queryClient = useQueryClient();

  // Fetch all campaigns
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["marketing-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MarketingCampaign[];
    },
  });

  // Create campaign
  const createCampaign = useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .insert({
          ...input,
          created_by: user?.user?.id,
          status: input.start_date && new Date(input.start_date) > new Date() ? "scheduled" : "draft",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Campaign created successfully!");
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create campaign");
    },
  });

  // Update campaign
  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MarketingCampaign> & { id: string }) => {
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Campaign updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update campaign");
    },
  });

  // Activate campaign
  const activateCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .update({ status: "active", start_date: new Date().toISOString() })
        .eq("id", campaignId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Campaign activated!");
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to activate campaign");
    },
  });

  // Pause campaign
  const pauseCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .update({ status: "paused" })
        .eq("id", campaignId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Campaign paused!");
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to pause campaign");
    },
  });

  // Delete campaign
  const deleteCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from("marketing_campaigns")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Campaign deleted!");
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete campaign");
    },
  });

  // Get campaign stats
  const getActiveCampaigns = () => campaigns.filter((c) => c.status === "active");
  const getDraftCampaigns = () => campaigns.filter((c) => c.status === "draft");
  const getScheduledCampaigns = () => campaigns.filter((c) => c.status === "scheduled");

  const getTotalStats = () => ({
    totalImpressions: campaigns.reduce((sum, c) => sum + c.impressions, 0),
    totalClicks: campaigns.reduce((sum, c) => sum + c.clicks, 0),
    totalConversions: campaigns.reduce((sum, c) => sum + c.conversions, 0),
    totalRevenue: campaigns.reduce((sum, c) => sum + (c.revenue_generated || 0), 0),
    avgConversionRate: campaigns.length > 0
      ? campaigns.reduce((sum, c) => sum + (c.clicks > 0 ? c.conversions / c.clicks : 0), 0) / campaigns.length * 100
      : 0,
  });

  return {
    campaigns,
    isLoading,
    createCampaign: createCampaign.mutate,
    updateCampaign: updateCampaign.mutate,
    activateCampaign: activateCampaign.mutate,
    pauseCampaign: pauseCampaign.mutate,
    deleteCampaign: deleteCampaign.mutate,
    isCreating: createCampaign.isPending,
    isUpdating: updateCampaign.isPending,
    getActiveCampaigns,
    getDraftCampaigns,
    getScheduledCampaigns,
    getTotalStats,
  };
};

