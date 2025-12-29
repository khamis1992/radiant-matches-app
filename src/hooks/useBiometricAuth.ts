import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

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
 * Supports fingerprint, Face ID, and other platform authenticators
 */
export const useBiometricAuth = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [credentials, setCredentials] = useState<BiometricCredential[]>([]);

  // Check if WebAuthn is supported
  useEffect(() => {
    const checkSupport = async () => {
      const supported =
        window.PublicKeyCredential !== undefined &&
        typeof window.PublicKeyCredential === "function";

      if (supported) {
        try {
          // Check if platform authenticator is available
          const available =
            await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsSupported(available);
        } catch {
          setIsSupported(false);
        }
      } else {
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []);

  // Load existing credentials
  useEffect(() => {
    const loadCredentials = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("biometric_credentials")
          .select("*")
          .eq("user_id", user.id);

        if (error) throw error;

        setCredentials(data || []);
        setIsEnabled((data || []).length > 0);
      } catch (error) {
        console.error("Failed to load biometric credentials:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCredentials();
  }, [user?.id]);

  // Generate a random challenge
  const generateChallenge = (): Uint8Array => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return array;
  };

  // Convert ArrayBuffer to base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Convert base64 to ArrayBuffer
  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // Register a new biometric credential
  const registerBiometric = useCallback(
    async (deviceName: string = "This Device") => {
      if (!user?.id || !user?.email) {
        toast.error("Please log in first");
        return false;
      }

      if (!isSupported) {
        toast.error("Biometric authentication is not supported on this device");
        return false;
      }

      try {
        const challenge = generateChallenge();

        const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions =
          {
            challenge,
            rp: {
              name: "Radiant Matches",
              id: window.location.hostname,
            },
            user: {
              id: new TextEncoder().encode(user.id),
              name: user.email,
              displayName: user.email,
            },
            pubKeyCredParams: [
              { alg: -7, type: "public-key" }, // ES256
              { alg: -257, type: "public-key" }, // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required",
              residentKey: "preferred",
            },
            timeout: 60000,
            attestation: "none",
          };

        const credential = (await navigator.credentials.create({
          publicKey: publicKeyCredentialCreationOptions,
        })) as PublicKeyCredential;

        if (!credential) {
          throw new Error("Failed to create credential");
        }

        const response = credential.response as AuthenticatorAttestationResponse;

        // Store credential in database
        const { error } = await supabase.from("biometric_credentials").insert({
          user_id: user.id,
          credential_id: arrayBufferToBase64(credential.rawId),
          public_key: arrayBufferToBase64(response.getPublicKey() || new ArrayBuffer(0)),
          device_name: deviceName,
        });

        if (error) throw error;

        // Store credential ID in localStorage for quick access
        localStorage.setItem(
          "biometric_credential_id",
          arrayBufferToBase64(credential.rawId)
        );

        setIsEnabled(true);
        toast.success("Biometric authentication enabled!");
        return true;
      } catch (error: any) {
        if (error.name === "NotAllowedError") {
          toast.error("Biometric registration was cancelled");
        } else {
          toast.error(error.message || "Failed to register biometric");
        }
        return false;
      }
    },
    [user, isSupported]
  );

  // Authenticate using biometric
  const authenticateWithBiometric = useCallback(async () => {
    if (!isSupported) {
      toast.error("Biometric authentication is not supported");
      return false;
    }

    const storedCredentialId = localStorage.getItem("biometric_credential_id");
    if (!storedCredentialId) {
      toast.error("No biometric credential found. Please set up biometric login first.");
      return false;
    }

    try {
      const challenge = generateChallenge();

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions =
        {
          challenge,
          rpId: window.location.hostname,
          allowCredentials: [
            {
              id: base64ToArrayBuffer(storedCredentialId),
              type: "public-key",
              transports: ["internal"],
            },
          ],
          userVerification: "required",
          timeout: 60000,
        };

      const assertion = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })) as PublicKeyCredential;

      if (!assertion) {
        throw new Error("Authentication failed");
      }

      // Update last used timestamp
      await supabase
        .from("biometric_credentials")
        .update({ last_used_at: new Date().toISOString() })
        .eq("credential_id", storedCredentialId);

      toast.success("Authenticated successfully!");
      return true;
    } catch (error: any) {
      if (error.name === "NotAllowedError") {
        toast.error("Authentication was cancelled");
      } else {
        toast.error(error.message || "Biometric authentication failed");
      }
      return false;
    }
  }, [isSupported]);

  // Remove a biometric credential
  const removeBiometric = useCallback(
    async (credentialId: string) => {
      if (!user?.id) return false;

      try {
        const { error } = await supabase
          .from("biometric_credentials")
          .delete()
          .eq("credential_id", credentialId)
          .eq("user_id", user.id);

        if (error) throw error;

        // Remove from localStorage if it's the current credential
        const stored = localStorage.getItem("biometric_credential_id");
        if (stored === credentialId) {
          localStorage.removeItem("biometric_credential_id");
        }

        setCredentials((prev) =>
          prev.filter((c) => c.credential_id !== credentialId)
        );
        setIsEnabled(credentials.length > 1);

        toast.success("Biometric credential removed");
        return true;
      } catch (error) {
        toast.error("Failed to remove biometric credential");
        return false;
      }
    },
    [user, credentials]
  );

  return {
    isSupported,
    isEnabled,
    isLoading,
    credentials,
    registerBiometric,
    authenticateWithBiometric,
    removeBiometric,
  };
};

