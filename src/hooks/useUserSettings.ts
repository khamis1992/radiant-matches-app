import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface UserSettings {
  id: string;
  user_id: string;
  push_notifications: boolean;
  email_notifications: boolean;
  booking_reminders: boolean;
  promotional_emails: boolean;
  profile_visibility: boolean;
  show_booking_history: boolean;
  share_data_analytics: boolean;
  created_at: string;
  updated_at: string;
}

export type UserSettingsUpdate = Partial<Omit<UserSettings, "id" | "user_id" | "created_at" | "updated_at">>;

const defaultSettings: Omit<UserSettings, "id" | "user_id" | "created_at" | "updated_at"> = {
  push_notifications: true,
  email_notifications: true,
  booking_reminders: true,
  promotional_emails: false,
  profile_visibility: true,
  show_booking_history: false,
  share_data_analytics: true,
};

export function useUserSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["user-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user settings:", error);
        throw error;
      }

      // If no settings exist, create default settings
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from("user_settings")
          .insert({ user_id: user.id, ...defaultSettings })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating user settings:", insertError);
          throw insertError;
        }

        return newSettings as UserSettings;
      }

      return data as UserSettings;
    },
    enabled: !!user?.id,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: UserSettingsUpdate) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("user_settings")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as UserSettings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user-settings", user?.id], data);
    },
    onError: (error) => {
      console.error("Error updating settings:", error);
      toast.error("Failed to save settings");
    },
  });

  return {
    settings: settings ?? defaultSettings,
    isLoading,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
}
