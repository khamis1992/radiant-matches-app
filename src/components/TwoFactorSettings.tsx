import { useState } from "react";
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, Key } from "lucide-react";
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
import { useTwoFactorAuth } from "@/hooks/useTwoFactorAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

/**
 * Two-Factor Authentication Settings Component
 * Allows users to enable, verify, and disable 2FA
 */
export const TwoFactorSettings = () => {
  const { t } = useLanguage();
  const {
    is2FAEnabled,
    isVerified,
    isLoading,
    enable2FA,
    verify2FA,
    disable2FA,
    regenerateBackupCodes,
    isEnabling,
    isVerifying,
    isDisabling,
  } = useTwoFactorAuth();

  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [secret, setSecret] = useState("");

  const handleEnable2FA = async () => {
    try {
      const result = await enable2FA();
      if (result) {
        setSecret(result.secret);
        setBackupCodes(result.backupCodes);
        setShowSetupDialog(true);
      }
    } catch {
      // Error handled by hook
    }
  };

  const handleVerify = () => {
    if (verificationCode.length !== 6) {
      toast.error(t.security?.invalidCode || "Please enter a 6-digit code");
      return;
    }
    verify2FA(verificationCode);
    setVerificationCode("");
    setShowSetupDialog(false);
  };

  const handleDisable = () => {
    disable2FA(disablePassword);
    setDisablePassword("");
    setShowDisableDialog(false);
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success(t.security?.codesCopied || "Backup codes copied!");
  };

  const handleRegenerateBackupCodes = async () => {
    try {
      const newCodes = await regenerateBackupCodes();
      if (newCodes) {
        setBackupCodes(newCodes);
        toast.success(t.security?.codesRegenerated || "New backup codes generated");
      }
    } catch {
      // Error handled by hook
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${is2FAEnabled ? "bg-green-100" : "bg-muted"}`}>
                {is2FAEnabled ? (
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                ) : (
                  <Shield className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">
                  {t.security?.twoFactorAuth || "Two-Factor Authentication"}
                </CardTitle>
                <CardDescription>
                  {t.security?.twoFactorDesc || "Add an extra layer of security to your account"}
                </CardDescription>
              </div>
            </div>
            <Badge variant={is2FAEnabled ? "default" : "secondary"}>
              {is2FAEnabled 
                ? (t.security?.enabled || "Enabled")
                : (t.security?.disabled || "Disabled")
              }
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {is2FAEnabled ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t.security?.twoFactorEnabledDesc || 
                  "Your account is protected with two-factor authentication. You'll need to enter a verification code when signing in."}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRegenerateBackupCodes}
                  className="gap-2"
                >
                  <Key className="w-4 h-4" />
                  {t.security?.regenerateCodes || "Regenerate Backup Codes"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDisableDialog(true)}
                  className="gap-2"
                >
                  <ShieldOff className="w-4 h-4" />
                  {t.security?.disable2FA || "Disable 2FA"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t.security?.twoFactorDisabledDesc ||
                  "Enable two-factor authentication to add an extra layer of security to your account."}
              </p>
              <Button onClick={handleEnable2FA} disabled={isEnabling} className="gap-2">
                {isEnabling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                {t.security?.enable2FA || "Enable 2FA"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.security?.setup2FA || "Set Up Two-Factor Authentication"}</DialogTitle>
            <DialogDescription>
              {t.security?.scanQRCode || 
                "Scan the QR code with your authenticator app, then enter the verification code."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Secret Key (in production, show QR code) */}
            <div className="space-y-2">
              <Label>{t.security?.secretKey || "Secret Key"}</Label>
              <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">
                {secret}
              </div>
              <p className="text-xs text-muted-foreground">
                {t.security?.manualEntry || "If you can't scan the QR code, enter this key manually in your authenticator app."}
              </p>
            </div>

            {/* Backup Codes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t.security?.backupCodes || "Backup Codes"}</Label>
                <Button variant="ghost" size="sm" onClick={copyBackupCodes} className="gap-1">
                  <Copy className="w-3 h-3" />
                  {t.common?.copy || "Copy"}
                </Button>
              </div>
              <div className="p-3 bg-muted rounded-lg grid grid-cols-2 gap-2 text-sm font-mono">
                {backupCodes.map((code, i) => (
                  <div key={i} className="text-center">{code}</div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {t.security?.saveBackupCodes || 
                  "Save these backup codes in a safe place. You can use them to access your account if you lose your phone."}
              </p>
            </div>

            {/* Verification Code */}
            <div className="space-y-2">
              <Label>{t.security?.verificationCode || "Verification Code"}</Label>
              <Input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center text-lg tracking-widest font-mono"
                maxLength={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSetupDialog(false)}>
              {t.common?.cancel || "Cancel"}
            </Button>
            <Button onClick={handleVerify} disabled={isVerifying || verificationCode.length !== 6}>
              {isVerifying ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {t.security?.verify || "Verify & Enable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.security?.disable2FATitle || "Disable Two-Factor Authentication"}</DialogTitle>
            <DialogDescription>
              {t.security?.disable2FADesc || 
                "Enter your password to disable two-factor authentication. This will make your account less secure."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t.auth?.password || "Password"}</Label>
              <Input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              {t.common?.cancel || "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={isDisabling || !disablePassword}
            >
              {isDisabling ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {t.security?.disable || "Disable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TwoFactorSettings;

