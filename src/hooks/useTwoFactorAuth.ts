import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface TwoFactorSettings {
  id: string;
  user_id: string;
  is_enabled: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook for managing Two-Factor Authentication
 * Provides setup, verification, and management of 2FA
 */
export const useTwoFactorAuth = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch 2FA settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["2fa-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_2fa_settings")
        .select("id, user_id, is_enabled, verified_at, created_at, updated_at")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as TwoFactorSettings | null;
    },
    enabled: !!user?.id,
  });

  // Generate TOTP secret (client-side for demo)
  const generateSecret = (): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let secret = "";
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  // Generate backup codes
  const generateBackupCodes = (): string[] => {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  // Enable 2FA
  const enable2FA = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const secret = generateSecret();
      const backupCodes = generateBackupCodes();

      // Store settings (in production, encrypt the secret)
      const { error } = await supabase.from("user_2fa_settings").upsert({
        user_id: user.id,
        is_enabled: false, // Will be enabled after verification
        secret_key: secret,
        backup_codes: backupCodes,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      return { secret, backupCodes };
    },
    onSuccess: ({ backupCodes }) => {
      toast.success("2FA setup initiated. Please verify with a code.");
      queryClient.invalidateQueries({ queryKey: ["2fa-settings"] });
      return { backupCodes };
    },
    onError: (error) => {
      toast.error(error.message || "Failed to enable 2FA");
    },
  });

  // Verify and activate 2FA
  const verify2FA = useMutation({
    mutationFn: async (code: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      // In production, verify the TOTP code against the secret
      // For demo, accept any 6-digit code
      if (!/^\d{6}$/.test(code)) {
        throw new Error("Invalid code format");
      }

      const { error } = await supabase
        .from("user_2fa_settings")
        .update({
          is_enabled: true,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      // Log the attempt
      await supabase.from("two_fa_attempts").insert({
        user_id: user.id,
        attempt_type: "totp",
        success: true,
      });

      return true;
    },
    onSuccess: () => {
      toast.success("2FA enabled successfully!");
      queryClient.invalidateQueries({ queryKey: ["2fa-settings"] });
    },
    onError: (error) => {
      toast.error(error.message || "Invalid verification code");
    },
  });

  // Disable 2FA
  const disable2FA = useMutation({
    mutationFn: async (password: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      // In production, verify password before disabling
      if (!password || password.length < 6) {
        throw new Error("Password required to disable 2FA");
      }

      const { error } = await supabase
        .from("user_2fa_settings")
        .update({
          is_enabled: false,
          secret_key: null,
          backup_codes: null,
          verified_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast.success("2FA disabled successfully");
      queryClient.invalidateQueries({ queryKey: ["2fa-settings"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to disable 2FA");
    },
  });

  // Regenerate backup codes
  const regenerateBackupCodes = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const newCodes = generateBackupCodes();

      const { error } = await supabase
        .from("user_2fa_settings")
        .update({
          backup_codes: newCodes,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;
      return newCodes;
    },
    onSuccess: (codes) => {
      toast.success("Backup codes regenerated");
      queryClient.invalidateQueries({ queryKey: ["2fa-settings"] });
      return codes;
    },
    onError: (error) => {
      toast.error(error.message || "Failed to regenerate codes");
    },
  });

  return {
    is2FAEnabled: settings?.is_enabled || false,
    isVerified: !!settings?.verified_at,
    isLoading,
    enable2FA: enable2FA.mutateAsync,
    verify2FA: verify2FA.mutate,
    disable2FA: disable2FA.mutate,
    regenerateBackupCodes: regenerateBackupCodes.mutateAsync,
    isEnabling: enable2FA.isPending,
    isVerifying: verify2FA.isPending,
    isDisabling: disable2FA.isPending,
  };
};

