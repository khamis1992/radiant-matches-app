import { useState } from "react";
import { Fingerprint, Smartphone, Trash2, Loader2, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { toast } from "sonner";

/**
 * Biometric Settings Component
 * Allows users to register and manage biometric authentication (fingerprint/Face ID)
 */
export const BiometricSettings = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const {
    isSupported,
    isEnabled,
    isLoading,
    credentials,
    registerCredential,
    removeCredential,
    saveCredentialLocally,
  } = useBiometricAuth();

  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async () => {
    setIsRegistering(true);
    const success = await registerCredential(deviceName || "My Device");
    setIsRegistering(false);
    if (success) {
      // Save credential info locally for biometric login
      if (user?.email) {
        // Get the latest credential
        const latestCredential = credentials[credentials.length - 1];
        if (latestCredential) {
          saveCredentialLocally(user.email, latestCredential.credential_id);
        }
        toast.success(language === "ar" ? "تم تفعيل البصمة بنجاح!" : "Biometric enabled successfully!");
      }
      setShowRegisterDialog(false);
      setDeviceName("");
    } else {
      toast.error(language === "ar" ? "فشل تفعيل البصمة" : "Failed to enable biometric");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <Fingerprint className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-medium">
                {t.biometric?.notSupported || "Biometric Not Supported"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {t.biometric?.notSupportedDesc ||
                  "Your device doesn't support biometric authentication."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isEnabled ? "bg-green-100" : "bg-muted"}`}>
                <Fingerprint className={`w-5 h-5 ${isEnabled ? "text-green-600" : "text-muted-foreground"}`} />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {t.biometric?.title || "Biometric Login"}
                </CardTitle>
                <CardDescription>
                  {t.biometric?.description || "Use fingerprint or Face ID to sign in quickly"}
                </CardDescription>
              </div>
            </div>
            <Badge variant={isEnabled ? "default" : "secondary"}>
              {isEnabled
                ? (t.biometric?.enabled || "Enabled")
                : (t.biometric?.disabled || "Disabled")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Registered Devices */}
          {credentials.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-muted-foreground">
                {t.biometric?.registeredDevices || "Registered Devices"}
              </h5>
              <div className="space-y-2">
                {credentials.map((credential) => (
                  <div
                    key={credential.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">
                          {credential.device_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t.biometric?.addedOn || "Added"}{" "}
                          {format(new Date(credential.created_at), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {credential.last_used_at && (
                        <span className="text-xs text-muted-foreground">
                          {t.biometric?.lastUsed || "Last used"}{" "}
                          {format(new Date(credential.last_used_at), "MMM d")}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCredential(credential.credential_id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Device Button */}
          <Button
            onClick={() => setShowRegisterDialog(true)}
            variant={isEnabled ? "outline" : "default"}
            className="w-full gap-2"
          >
            {isEnabled ? (
              <>
                <Plus className="w-4 h-4" />
                {t.biometric?.addDevice || "Add Another Device"}
              </>
            ) : (
              <>
                <Fingerprint className="w-4 h-4" />
                {t.biometric?.enableBiometric || "Enable Biometric Login"}
              </>
            )}
          </Button>

          {/* Info Text */}
          <p className="text-xs text-muted-foreground text-center">
            {t.biometric?.infoText ||
              "Your biometric data never leaves your device. We only store a secure key."}
          </p>
        </CardContent>
      </Card>

      {/* Register Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5" />
              {t.biometric?.setupTitle || "Set Up Biometric Login"}
            </DialogTitle>
            <DialogDescription>
              {t.biometric?.setupDesc ||
                "Use your fingerprint or face to quickly sign in to your account."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t.biometric?.deviceName || "Device Name"}</Label>
              <Input
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder={t.biometric?.deviceNamePlaceholder || "e.g., iPhone 15, MacBook Pro"}
              />
              <p className="text-xs text-muted-foreground">
                {t.biometric?.deviceNameHelp ||
                  "Give this device a name to identify it later."}
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="font-medium">{t.biometric?.readyToSetup || "Ready to Set Up"}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t.biometric?.setupInstructions ||
                  "When you click the button below, your device will prompt you to verify your identity using fingerprint or face recognition."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegisterDialog(false)}>
              {t.common?.cancel || "Cancel"}
            </Button>
            <Button onClick={handleRegister} disabled={isRegistering} className="gap-2">
              {isRegistering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.biometric?.registering || "Registering..."}
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  {t.biometric?.register || "Register Biometric"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BiometricSettings;

