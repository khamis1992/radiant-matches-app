import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PlatformSettings {
  commission_rate: number;
  min_booking_hours: number;
  max_booking_days: number;
  cancellation_hours: number;
  platform_name: string;
  support_email: string;
  support_phone: string;
  // Report customization
  report_logo_url: string;
  report_primary_color: string;
  report_secondary_color: string;
  report_company_name: string;
  report_footer_text: string;
}

const defaultSettings: PlatformSettings = {
  commission_rate: 15,
  min_booking_hours: 24,
  max_booking_days: 30,
  cancellation_hours: 24,
  platform_name: "منصة التجميل",
  support_email: "support@example.com",
  support_phone: "+966500000000",
  report_logo_url: "",
  report_primary_color: "#8b5cf6",
  report_secondary_color: "#a855f7",
  report_company_name: "Glam",
  report_footer_text: "جميع الحقوق محفوظة",
};

export const usePlatformSettings = () => {
  return useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value");

      if (error) throw error;

      const settings: PlatformSettings = { ...defaultSettings };
      
      data?.forEach((setting) => {
        const key = setting.key as keyof PlatformSettings;
        if (key in settings) {
          const value = setting.value as Record<string, unknown>;
          if (typeof value === "object" && value !== null) {
            if ("value" in value) {
              settings[key] = value.value as never;
            } else if ("rate" in value) {
              settings[key] = value.rate as never;
            }
          }
        }
      });

      return settings;
    },
  });
};

export const useUpdatePlatformSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<PlatformSettings>) => {
      const updates = Object.entries(settings).map(async ([key, value]) => {
        const settingValue = key === "commission_rate" 
          ? { rate: value } 
          : { value };

        const { error } = await supabase
          .from("platform_settings")
          .upsert(
            {
              key,
              value: settingValue,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "key" }
          );

        if (error) throw error;
      });

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      toast.success("تم حفظ الإعدادات بنجاح");
    },
    onError: (error) => {
      console.error("Error updating settings:", error);
      toast.error("فشل حفظ الإعدادات");
    },
  });
};
