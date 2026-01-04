/**
 * React hooks for Capacitor native functionality
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Platform,
  getDeviceInfo,
  getCurrentPosition,
  watchPosition,
  clearWatch,
  hapticImpact,
  hapticNotify,
  Storage,
  AppState,
  initNative,
  takePhoto as capTakePhoto,
  pickImage as capPickImage,
} from '../lib/capacitor';

/**
 * Hook for device information
 */
export const useDeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState<{
    platform: string;
    model: string;
    osVersion: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeviceInfo = async () => {
      setLoading(true);
      const info = await getDeviceInfo();
      setDeviceInfo(info);
      setLoading(false);
    };

    fetchDeviceInfo();
  }, []);

  return { deviceInfo, loading, isNative: Platform.isNative };
};

/**
 * Hook for geolocation
 */
export const useGeolocation = () => {
  const [position, setPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      setPosition(pos);
      return pos;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get position';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const watch = useCallback((callback: (pos: { latitude: number; longitude: number }) => void) => {
    if (!Platform.isNative) {
      console.warn('Geolocation is only available on native platforms');
      return null;
    }

    const watchId = watchPosition(callback);
    return watchId;
  }, []);

  return { position, error, loading, getCurrent, watch, clearWatch };
};

/**
 * Hook for haptic feedback
 */
export const useHaptics = () => {
  const impact = useCallback(async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    // Import ImpactStyle enum
    const { ImpactStyle } = await import('@capacitor/haptics');
    const styleMap = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await hapticImpact(styleMap[style]);
  }, []);

  const notify = useCallback(async (type: 'success' | 'warning' | 'error') => {
    // Import NotificationType enum
    const { NotificationType } = await import('@capacitor/haptics');
    const typeMap = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error,
    };
    await hapticNotify({ type: typeMap[type] });
  }, []);

  return { impact, notify };
};

/**
 * Hook for camera
 */
export const useCamera = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takePhoto = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const photo = await capTakePhoto();
      return photo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to take photo';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const pickImage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const image = await capPickImage();
      return image;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pick image';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { takePhoto, pickImage, loading, error };
};

/**
 * Hook for storage
 */
export const useStorage = <T = unknown>(key: string) => {
  const [value, setValue] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadValue = async () => {
      setLoading(true);
      const storedValue = await Storage.get(key);
      setValue(storedValue ? JSON.parse(storedValue) : null);
      setLoading(false);
    };

    loadValue();
  }, [key]);

  const setStoredValue = useCallback(async (newValue: T) => {
    setValue(newValue);
    await Storage.set(key, JSON.stringify(newValue));
  }, [key]);

  const removeValue = useCallback(async () => {
    setValue(null);
    await Storage.remove(key);
  }, [key]);

  return { value, loading, setValue: setStoredValue, removeValue };
};

/**
 * Hook for app state
 */
export const useAppState = () => {
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!Platform.isNative) return;

    const listener = AppState.addListener((state) => {
      setIsActive(state.isActive);
    });

    return () => {
      listener.then((handler) => handler.remove());
    };
  }, []);

  return isActive;
};

/**
 * Hook for initializing native features
 */
export const useInitNative = () => {
  useEffect(() => {
    initNative();
  }, []);
};

/**
 * Export platform constants
 */
export { Platform };
