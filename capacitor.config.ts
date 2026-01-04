import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.glam.app',
  appName: 'Glam',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    // For development with live reload - use your local IP
    url: 'http://192.168.18.40:8080',
    cleartext: true,
    androidScheme: 'https'
  },
  android: {
    // Build configuration for Android
    buildOptions: {
      signingType: 'apksigner'
    }
  },
  ios: {
    // Build configuration for iOS
    scheme: 'Glam'
  },
  plugins: {
    // Camera plugin configuration
    Camera: {
      permissions: ['camera', 'photos']
    },
    // Geolocation plugin configuration
    Geolocation: {
      permissions: ['location', 'coarseLocation']
    },
    // SplashScreen configuration
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#d97b8c',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    },
    // StatusBar configuration
    StatusBar: {
      style: 'dark',
      overlaysWebView: true
    },
    // Keyboard configuration
    Keyboard: {
      resize: 'ionic',
      style: 'dark',
      resizeOnFullScreen: true
    },
    // App configuration
    App: {
      overrideUserAgent: 'Glam Mobile App'
    }
  }
};

export default config;
