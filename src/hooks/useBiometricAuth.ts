import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface BiometricCredential {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  device_name: string;
  created_at: string;
  last_used_at: string | null;
}

// Helper to convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Helper to convert Base64 to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Hook for biometric authentication using WebAuthn API
 */
export const useBiometricAuth = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState<BiometricCredential[]>([]);

  // Check if WebAuthn is supported
  useEffect(() => {
    const checkSupport = async () => {
      if (window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
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

  // Fetch user's credentials
  const fetchCredentials = useCallback(async () => {
    if (!user) {
      setCredentials([]);
      setIsEnabled(false);
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
      console.error("Error fetching biometric credentials:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  // Register a new biometric credential
  const registerCredential = async (deviceName: string): Promise<boolean> => {
    if (!user || !isSupported) return false;

    setIsLoading(true);
    try {
      // Create a challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "Glam Beauty",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(user.id),
          name: user.email || user.id,
          displayName: user.email?.split("@")[0] || "User",
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

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) return false;

      const response = credential.response as AuthenticatorAttestationResponse;
      
      // Store credential in database
      const { error } = await supabase.from("biometric_credentials").insert({
        user_id: user.id,
        credential_id: arrayBufferToBase64(credential.rawId),
        public_key: arrayBufferToBase64(response.getPublicKey() || new ArrayBuffer(0)),
        device_name: deviceName,
      });

      if (error) throw error;

      await fetchCredentials();
      return true;
    } catch (error) {
      console.error("Error registering biometric:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Authenticate using stored credential
  const authenticate = async (savedEmail?: string): Promise<{ success: boolean; email?: string }> => {
    if (!isSupported) return { success: false };

    setIsLoading(true);
    try {
      // Get stored credentials for the user (we need to know which user is trying to log in)
      // For biometric login, we look at localStorage for saved email
      const storedEmail = savedEmail || localStorage.getItem("remembered_email");
      
      if (!storedEmail) {
        return { success: false };
      }

      // Fetch user profile to get user_id
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", storedEmail)
        .single();

      if (!profiles) {
        return { success: false };
      }

      // We can't fetch credentials without being logged in due to RLS
      // So we use a different approach: store credential info locally
      const storedCredential = localStorage.getItem(`biometric_credential_${storedEmail}`);
      
      if (!storedCredential) {
        return { success: false };
      }

      const credentialInfo = JSON.parse(storedCredential);
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId: window.location.hostname,
        allowCredentials: [{
          type: "public-key",
          id: base64ToArrayBuffer(credentialInfo.credentialId),
          transports: ["internal"],
        }],
        userVerification: "required",
        timeout: 60000,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!assertion) {
        return { success: false };
      }

      // Biometric verified! Return success with email
      return { success: true, email: storedEmail };
    } catch (error) {
      console.error("Biometric authentication failed:", error);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // Save credential info locally for biometric login
  const saveCredentialLocally = (email: string, credentialId: string) => {
    localStorage.setItem(`biometric_credential_${email}`, JSON.stringify({ credentialId }));
  };

  // Remove a credential
  const removeCredential = async (credentialId: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("biometric_credentials")
        .delete()
        .eq("id", credentialId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Also remove from localStorage
      if (user.email) {
        localStorage.removeItem(`biometric_credential_${user.email}`);
      }

      await fetchCredentials();
    } catch (error) {
      console.error("Error removing credential:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if biometric is available for a specific email
  const hasBiometricForEmail = (email: string): boolean => {
    return !!localStorage.getItem(`biometric_credential_${email}`);
  };

  return {
    isSupported,
    isEnabled,
    isLoading,
    credentials,
    registerCredential,
    authenticate,
    removeCredential,
    saveCredentialLocally,
    hasBiometricForEmail,
    fetchCredentials,
  };
};
