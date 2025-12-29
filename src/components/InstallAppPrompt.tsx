import { useState, useEffect } from "react";
import { Download, X, Smartphone, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Install App Prompt Component
 * Shows a banner prompting users to install the PWA
 */
export const InstallAppPrompt = () => {
  const { t } = useLanguage();
  const { canInstall, promptInstall, isOffline, isUpdateAvailable, applyUpdate } = useServiceWorker();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show prompt after 30 seconds if not dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem("install-prompt-dismissed");
    if (dismissed) {
      setDismissed(true);
      return;
    }

    const timer = setTimeout(() => {
      if (canInstall) {
        setShowInstallPrompt(true);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [canInstall]);

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setDismissed(true);
    localStorage.setItem("install-prompt-dismissed", "true");
  };

  // Update available banner
  if (isUpdateAvailable) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
        <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5" />
              <div>
                <p className="font-medium text-sm">
                  {t.pwa?.updateAvailable || "Update Available"}
                </p>
                <p className="text-xs opacity-80">
                  {t.pwa?.updateDesc || "A new version is ready to install"}
                </p>
              </div>
            </div>
            <Button
              onClick={applyUpdate}
              size="sm"
              variant="secondary"
              className="shrink-0"
            >
              {t.pwa?.update || "Update"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Offline indicator
  if (isOffline) {
    return (
      <div className="fixed top-16 left-4 right-4 z-50 animate-slide-down">
        <div className="bg-yellow-500 text-yellow-950 rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5" />
            <p className="text-sm font-medium">
              {t.pwa?.offline || "You're offline. Some features may be unavailable."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Install prompt
  if (showInstallPrompt && canInstall && !dismissed) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
        <div className="bg-card border border-border rounded-lg shadow-lg p-4">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Smartphone className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">
                {t.pwa?.installTitle || "Install Radiant Matches"}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {t.pwa?.installDesc ||
                  "Add to your home screen for quick access and offline support."}
              </p>
              <div className="flex gap-2">
                <Button onClick={handleInstall} size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  {t.pwa?.install || "Install"}
                </Button>
                <Button onClick={handleDismiss} variant="ghost" size="sm">
                  {t.pwa?.notNow || "Not Now"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default InstallAppPrompt;

