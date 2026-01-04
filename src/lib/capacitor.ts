/**
 * Capacitor native functionality wrapper
 * Provides safe access to native device features
 */

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';

/**
 * Check if app is running on native platform
 */
export const isNative = Capacitor.isNativePlatform();
export const isAndroid = Capacitor.getPlatform() === 'android';
export const isIOS = Capacitor.getPlatform() === 'ios';
export const isWeb = Capacitor.getPlatform() === 'web';

/**
 * Platform detection utilities
 */
export const Platform = {
  isNative,
  isAndroid,
  isIOS,
  isWeb,
};

/**
 * Initialize app status bar
 */
export const initStatusBar = async () => {
  if (!isNative) return;

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#d97b8c' });
    if (isAndroid) {
      await StatusBar.show();
    }
  } catch (error) {
    console.warn('Failed to set status bar style:', error);
  }
};

/**
 * Hide splash screen
 */
export const hideSplashScreen = async () => {
  if (!isNative) return;

  try {
    await SplashScreen.hide();
  } catch (error) {
    console.warn('Failed to hide splash screen:', error);
  }
};

/**
 * Get device information
 */
export const getDeviceInfo = async () => {
  if (!isNative) {
    return {
      platform: 'web',
      model: 'Web Browser',
      osVersion: 'Unknown',
    };
  }

  try {
    const info = await Device.getInfo();
    return {
      platform: info.platform,
      model: info.model,
      osVersion: info.osVersion,
    };
  } catch (error) {
    console.warn('Failed to get device info:', error);
    return {
      platform: 'unknown',
      model: 'Unknown',
      osVersion: 'Unknown',
    };
  }
};

/**
 * Take a photo using the camera
 */
export const takePhoto = async () => {
  if (!isNative) {
    throw new Error('Camera is only available on native platforms');
  }

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    });
    return image.webPath;
  } catch (error) {
    console.warn('Failed to take photo:', error);
    throw error;
  }
};

/**
 * Pick an image from the gallery
 */
export const pickImage = async () => {
  if (!isNative) {
    throw new Error('Image picker is only available on native platforms');
  }

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
    });
    return image.webPath;
  } catch (error) {
    console.warn('Failed to pick image:', error);
    throw error;
  }
};

/**
 * Get current position
 */
export const getCurrentPosition = async () => {
  if (!isNative) {
    throw new Error('Geolocation is only available on native platforms');
  }

  try {
    const position = await Geolocation.getCurrentPosition();
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  } catch (error) {
    console.warn('Failed to get position:', error);
    throw error;
  }
};

/**
 * Watch position changes
 */
export const watchPosition = (callback: (position: { latitude: number; longitude: number }) => void) => {
  if (!isNative) {
    console.warn('Geolocation is only available on native platforms');
    return null;
  }

  const watchId = Geolocation.watchPosition({}, (position, err) => {
    if (err) {
      console.warn('Position error:', err);
      return;
    }
    callback({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
  });

  return watchId;
};

/**
 * Clear position watch
 */
export const clearWatch = (watchId: string | null) => {
  if (watchId) {
    Geolocation.clearWatch({ id: watchId });
  }
};

/**
 * Trigger haptic feedback
 */
export const hapticImpact = async (style: ImpactStyle = ImpactStyle.Medium) => {
  if (!isNative) return;

  try {
    await Haptics.impact({ style });
  } catch (error) {
    console.warn('Failed to trigger haptic:', error);
  }
};

/**
 * Trigger haptic notification
 */
export const hapticNotify = async (type: { type: unknown }) => {
  if (!isNative) return;

  try {
    await Haptics.notification(type as Parameters<typeof Haptics.notification>[0]);
  } catch (error) {
    console.warn('Failed to trigger haptic notification:', error);
  }
};

/**
 * Show keyboard
 */
export const showKeyboard = async () => {
  if (!isNative) return;

  try {
    await Keyboard.show();
  } catch (error) {
    console.warn('Failed to show keyboard:', error);
  }
};

/**
 * Hide keyboard
 */
export const hideKeyboard = async () => {
  if (!isNative) return;

  try {
    await Keyboard.hide();
  } catch (error) {
    console.warn('Failed to hide keyboard:', error);
  }
};

/**
 * Local storage using Capacitor Preferences
 */
export const Storage = {
  async set(key: string, value: string) {
    if (isNative) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  },

  async get(key: string): Promise<string | null> {
    if (isNative) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    return localStorage.getItem(key);
  },

  async remove(key: string) {
    if (isNative) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  },

  async clear() {
    if (isNative) {
      await Preferences.clear();
    } else {
      localStorage.clear();
    }
  },
};

/**
 * App state management
 */
export const AppState = {
  addListener: (listener: (state: { isActive: boolean }) => void) => {
    if (isNative) {
      return App.addListener('appStateChange', listener);
    }
    return Promise.resolve({ remove: () => {} });
  },
};

/**
 * Initialize all native features
 */
export const initNative = async () => {
  if (!isNative) return;

  try {
    await initStatusBar();
    await hideSplashScreen();
  } catch (error) {
    console.warn('Failed to initialize native features:', error);
  }
};

/**
 * Export all Capacitor plugins for direct access
 */
export const CapacitorPlugins = {
  Camera,
  Geolocation,
  Device,
  StatusBar,
  SplashScreen,
  Keyboard,
  Haptics,
  Preferences,
  App,
};
