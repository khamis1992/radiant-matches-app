import { useCallback } from "react";

/**
 * Lightweight haptic feedback hook.
 * Uses Capacitor Haptics on native, falls back to silent no-op on web.
 */
export const useHapticFeedback = () => {
  const tap = useCallback(async () => {
    try {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Web fallback — do nothing
    }
  }, []);

  const medium = useCallback(async () => {
    try {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // Not available on web — ignore
    }
  }, []);

  const success = useCallback(async () => {
    try {
      const { Haptics, NotificationType } = await import("@capacitor/haptics");
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      // Not available on web — ignore
    }
  }, []);

  return { tap, medium, success };
};
