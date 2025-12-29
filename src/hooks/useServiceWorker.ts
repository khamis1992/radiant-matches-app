import { useState, useEffect, useCallback } from "react";

interface ServiceWorkerState {
  isInstalled: boolean;
  isUpdateAvailable: boolean;
  isOffline: boolean;
  registration: ServiceWorkerRegistration | null;
}

/**
 * Hook for managing the service worker
 * Handles installation, updates, and offline status
 */
export const useServiceWorker = () => {
  const [state, setState] = useState<ServiceWorkerState>({
    isInstalled: false,
    isUpdateAvailable: false,
    isOffline: !navigator.onLine,
    registration: null,
  });

  // Register service worker (PROD only) + always track offline status
  useEffect(() => {
    // Listen for online/offline status
    const handleOnline = () => setState((prev) => ({ ...prev, isOffline: false }));
    const handleOffline = () => setState((prev) => ({ ...prev, isOffline: true }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Service Worker: disable in development to prevent stale-module caching/HMR issues
    if ("serviceWorker" in navigator) {
      if (import.meta.env.DEV) {
        const key = "glam-sw-dev-unregistered";
        try {
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, "1");
            navigator.serviceWorker.getRegistrations().then(async (regs) => {
              await Promise.all(regs.map((r) => r.unregister()));
            }).finally(() => {
              // If an SW was controlling this tab, reload once to ensure fresh assets.
              if (navigator.serviceWorker.controller) {
                window.location.reload();
              }
            });
          }
        } catch {
          // ignore storage access issues
        }
      } else {
        registerServiceWorker();
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      setState((prev) => ({
        ...prev,
        isInstalled: true,
        registration,
      }));

      // Check for updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setState((prev) => ({ ...prev, isUpdateAvailable: true }));
            }
          });
        }
      });

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Every hour

      console.log("[PWA] Service worker registered");
    } catch (error) {
      console.error("[PWA] Service worker registration failed:", error);
    }
  };

  // Apply pending update
  const applyUpdate = useCallback(() => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  }, [state.registration]);

  // Request to add to home screen
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false;

    installPrompt.prompt();
    const result = await installPrompt.userChoice;

    if (result.outcome === "accepted") {
      setInstallPrompt(null);
      return true;
    }
    return false;
  }, [installPrompt]);

  const canInstall = !!installPrompt;

  return {
    ...state,
    applyUpdate,
    promptInstall,
    canInstall,
  };
};

// BeforeInstallPromptEvent type
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

