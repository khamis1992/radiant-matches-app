import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.glam.app',
  appName: 'Glam',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    cleartext: true,
    androidScheme: 'https'
  },
  android: {
    // Build configuration for Android
    buildOptions: {
      signingType: 'apksigner'
    },
    // Enable safe area layouts for Android navigation bar
    webContentsDebuggingEnabled: false
  },
  ios: {
    // Build configuration for iOS
    scheme: 'Glam',
    // Configure iOS to handle safe areas properly
    contentInset: 'always'
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
