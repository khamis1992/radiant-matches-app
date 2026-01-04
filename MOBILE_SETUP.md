# Glam - Mobile App Setup Guide

This app has been configured with Capacitor for cross-platform mobile development (iOS and Android).

## App Information

- **App Name**: Glam
- **Bundle ID**: `com.glam.app`
- **Platforms**: Web, iOS, Android

## Prerequisites

### For Android Development:
- Android Studio installed
- Android SDK (API 33+ recommended)
- Java Development Kit (JDK) 11 or higher

### For iOS Development (macOS only):
- Xcode installed
- iOS Simulator
- Apple Developer Account (for device testing and App Store submission)
- CocoaPods installed: `sudo gem install cocoapods`

## Available Scripts

### Web Development:
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Mobile Development:
```bash
# Sync web assets to native platforms
npm run cap:sync             # Sync all platforms
npm run cap:sync:android     # Sync Android only
npm run cap:sync:ios         # Sync iOS only

# Open in IDE
npm run cap:open:android     # Open Android Studio
npm run cap:open:ios         # Open Xcode

# Build and run on device/emulator
npm run android:build        # Build and sync Android
npm run android:run          # Build, sync and run Android
npm run ios:build            # Build and sync iOS
npm run ios:run              # Build, sync and run iOS
```

## Development Workflow

### 1. Initial Setup

First time setup for each platform:

**Android:**
```bash
npm run cap:sync:android
npm run cap:open:android
```
This will open Android Studio. Let it finish syncing Gradle, then you can run the app on an emulator or connected device.

**iOS (macOS only):**
```bash
npm run cap:sync:ios
npm run cap:open:ios
```
This will open Xcode. Select a simulator or connected device and press Cmd+R to run.

### 2. Development Workflow

For making changes to your app:

1. Make changes to your React code
2. Build the web assets: `npm run build`
3. Sync to platforms: `npm run cap:sync`
4. Update running app in Android Studio/Xcode

**For faster development with live reload:**

Run the development server:
```bash
npm run dev
```

Then update `capacitor.config.ts` to point to your dev server (change `localhost` to your local IP for device testing):

```typescript
server: {
  url: 'http://192.168.1.X:8080', // Your local IP
  cleartext: true
}
```

Then sync and run: `npm run android:run` or `npm run ios:run`

### 3. Production Build

**Android:**
```bash
npm run build
npm run cap:sync:android
npm run cap:open:android
```
In Android Studio: Build > Generate Signed Bundle/APK

**iOS:**
```bash
npm run build
npm run cap:sync:ios
npm run cap:open:ios
```
In Xcode: Product > Archive

## Capacitor Plugins Installed

The following Capacitor plugins are installed and ready to use:

- `@capacitor/app` - App lifecycle events
- `@capacitor/camera` - Camera and photo gallery access
- `@capacitor/device` - Device information
- `@capacitor/geolocation` - GPS location
- `@capacitor/haptics` - Haptic feedback
- `@capacitor/keyboard` - Keyboard management
- `@capacitor/preferences` - Persistent key-value storage
- `@capacitor/splash-screen` - Splash screen
- `@capacitor/status-bar` - Status bar customization

## Using Capacitor Features

Import from the custom hooks:

```tsx
import { useHaptics, useCamera, useGeolocation, Platform } from '@/hooks/useCapacitor';

function MyComponent() {
  const { impact } = useHaptics();
  const { takePhoto, pickImage } = useCamera();
  const { position, getCurrent } = useGeolocation();

  const handleTap = async () => {
    await impact('medium');
  };

  return (
    <div>
      {Platform.isNative && <p>Running on native!</p>}
      <button onClick={handleTap}>Tap me!</button>
    </div>
  );
}
```

Or import directly from the utilities:

```tsx
import { Storage, Platform } from '@/lib/capacitor';

// Save data
await Storage.set('user-id', '12345');

// Get data
const userId = await Storage.get('user-id');
```

## Platform-Specific Configuration

### Android Configuration

Located in: `android/app/src/main/AndroidManifest.xml`

You can configure:
- App permissions
- App theme
- Screen orientation
- Deep links

### iOS Configuration

Located in: `ios/App/App/Info.plist`

You can configure:
- App permissions
- Supported orientations
- URL schemes
- App icons and launch screens

## PWA Support

The app continues to work as a Progressive Web App (PWA) with:
- Service Worker for offline support
- Web App Manifest for installability
- Responsive design for all screen sizes

The PWA and native versions share the same codebase.

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Clear Capacitor cache:
   ```bash
   npx cap clean android
   npx cap clean ios
   npm run build
   npx cap sync
   ```

2. Reinstall node_modules:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Android Issues

- **Gradle sync fails**: Open Android Studio and let it finish downloading dependencies
- **App crashes**: Check Logcat in Android Studio for error messages
- **Permissions**: Check AndroidManifest.xml for required permissions

### iOS Issues

- **CocoaPods errors**: Run `pod install` in the ios/App directory
- **Build fails**: Clean build folder in Xcode (Product > Clean Build Folder)
- **Simulator issues**: Try resetting the simulator (Device > Erase All Content and Settings)

### Common Issues

- **White screen**: Make sure you ran `npm run build` before syncing
- **Old code showing**: Clear Capacitor cache and rebuild
- **Hot reload not working**: Use the development server URL method mentioned above

## Testing on Physical Devices

### Android:
1. Enable USB debugging on your device
2. Connect via USB
3. Run: `npm run android:run`

### iOS:
1. Connect your iPhone to your Mac
2. Trust the computer on your device
3. In Xcode, select your device from the device menu
4. Press Cmd+R to run

## App Store Submission

### Google Play Store (Android):
1. Generate signed APK or Bundle in Android Studio
2. Create account on Google Play Console
3. Upload and complete store listing

### Apple App Store (iOS):
1. Requires Apple Developer Account ($99/year)
2. Archive build in Xcode
3. Upload to App Store Connect
4. Complete app listing and submit for review

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor CLI Commands](https://capacitorjs.com/docs/cli)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [React Native vs Capacitor](https://capacitorjs.com/docs/#vs-react-native)

## Next Steps

1. Test the app on simulators/emulators
2. Implement native features using the provided hooks
3. Design app icons and splash screens
4. Configure app permissions properly
5. Test on physical devices
6. Prepare for app store submission

## File Structure

```
radiant-matches-app/
├── src/
│   ├── hooks/
│   │   └── useCapacitor.ts       # React hooks for native features
│   └── lib/
│       └── capacitor.ts          # Capacitor utilities
├── android/                       # Android native project
├── ios/                          # iOS native project
├── capacitor.config.ts           # Capacitor configuration
├── vite.config.ts                # Vite build configuration
└── package.json                  # Dependencies and scripts
```
