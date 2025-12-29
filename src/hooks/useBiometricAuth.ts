import { useState } from "react";

interface BiometricCredential {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  device_name: string;
  created_at: string;
  last_used_at: string | null;
}

/**
 * Hook for biometric authentication using WebAuthn API
 * Note: This feature requires the biometric_credentials table to be created
 */
export const useBiometricAuth = () => {
  const [isSupported] = useState(false);
  const [isEnabled] = useState(false);
  const [isLoading] = useState(false);
  const [credentials] = useState<BiometricCredential[]>([]);

  const registerCredential = async (_deviceName: string) => {
    console.log("Biometric auth not configured - table not available");
    return false;
  };

  const authenticate = async () => {
    console.log("Biometric auth not configured - table not available");
    return false;
  };

  const removeCredential = async (_credentialId: string) => {
    console.log("Biometric auth not configured - table not available");
  };

  return {
    isSupported,
    isEnabled,
    isLoading,
    credentials,
    registerCredential,
    authenticate,
    removeCredential,
  };
};
