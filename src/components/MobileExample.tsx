/**
 * MobileExample.tsx
 *
 * This component demonstrates how to use Capacitor native features
 * in your React app. Use this as a reference for implementing
 * mobile-specific functionality in your components.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useHaptics, useCamera, useGeolocation, useDeviceInfo, Platform } from '@/hooks/useCapacitor';
import { Camera, MapPin, Smartphone, Vibrate } from 'lucide-react';

export function MobileExample() {
  const { impact, notify } = useHaptics();
  const { takePhoto, pickImage, loading: cameraLoading } = useCamera();
  const { position, getCurrent, loading: geoLoading } = useGeolocation();
  const { deviceInfo, loading: deviceLoading } = useDeviceInfo();

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const handleTakePhoto = async () => {
    await impact('medium');
    const photo = await takePhoto();
    if (photo) {
      setPhotoUrl(photo);
      await notify('success');
    }
  };

  const handlePickImage = async () => {
    await impact('light');
    const image = await pickImage();
    if (image) {
      setPhotoUrl(image);
      await notify('success');
    }
  };

  const handleGetLocation = async () => {
    await impact('heavy');
    await getCurrent();
    await notify('success');
  };

  if (!Platform.isNative) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile Features Demo
          </CardTitle>
          <CardDescription>
            Native features are only available on mobile devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This component demonstrates Capacitor native features. To test these features,
            run the app on an Android or iOS device using:
          </p>
          <div className="mt-4 space-y-2 text-xs font-mono bg-muted p-3 rounded">
            <p>npm run android:run</p>
            <p>npm run ios:run</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Device Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Device Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deviceLoading ? (
            <p className="text-sm text-muted-foreground">Loading device info...</p>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform:</span>
                <span className="font-medium capitalize">{deviceInfo?.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model:</span>
                <span className="font-medium">{deviceInfo?.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">OS Version:</span>
                <span className="font-medium">{deviceInfo?.osVersion}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Haptics Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vibrate className="h-5 w-5" />
            Haptic Feedback
          </CardTitle>
          <CardDescription>Test different haptic patterns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            onClick={() => impact('light')}
            variant="outline"
            className="w-full"
          >
            Light Impact
          </Button>
          <Button
            onClick={() => impact('medium')}
            variant="outline"
            className="w-full"
          >
            Medium Impact
          </Button>
          <Button
            onClick={() => impact('heavy')}
            variant="outline"
            className="w-full"
          >
            Heavy Impact
          </Button>
          <div className="grid grid-cols-3 gap-2 pt-2">
            <Button
              onClick={() => notify('success')}
              variant="secondary"
              size="sm"
            >
              Success
            </Button>
            <Button
              onClick={() => notify('warning')}
              variant="secondary"
              size="sm"
            >
              Warning
            </Button>
            <Button
              onClick={() => notify('error')}
              variant="secondary"
              size="sm"
            >
              Error
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Camera Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera
          </CardTitle>
          <CardDescription>Take photos or pick from gallery</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleTakePhoto}
              disabled={cameraLoading}
              className="w-full"
            >
              {cameraLoading ? 'Loading...' : 'Take Photo'}
            </Button>
            <Button
              onClick={handlePickImage}
              disabled={cameraLoading}
              variant="outline"
              className="w-full"
            >
              {cameraLoading ? 'Loading...' : 'Pick Image'}
            </Button>
          </div>
          {photoUrl && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-2">Selected Image:</p>
              <img
                src={photoUrl}
                alt="Selected"
                className="w-full h-48 object-cover rounded-md border"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geolocation Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Geolocation
          </CardTitle>
          <CardDescription>Get your current location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleGetLocation}
            disabled={geoLoading}
            className="w-full"
          >
            {geoLoading ? 'Getting Location...' : 'Get Current Location'}
          </Button>
          {position && (
            <div className="text-sm space-y-1 bg-muted p-3 rounded">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Latitude:</span>
                <span className="font-mono">{position.latitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Longitude:</span>
                <span className="font-mono">{position.longitude.toFixed(6)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
