import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation } from "lucide-react";

// Fix Leaflet marker icon issue
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  onClose: () => void;
  initialLat?: number;
  initialLng?: number;
}

const LocationMarker = ({ position, setPosition }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void }) => {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position} draggable={true} eventHandlers={{
      dragend: (e) => {
        const marker = e.target;
        const position = marker.getLatLng();
        setPosition([position.lat, position.lng]);
      },
    }} />
  );
};

export const LocationPicker = ({ onLocationSelect, onClose, initialLat, initialLng }: LocationPickerProps) => {
  const { t, language } = useLanguage();
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : [25.2854, 51.5310]
  );
  
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t.settings?.locationNotAvailable || "Geolocation is not supported by your browser");
      return;
    }

    toast.info(t.settings?.detectingLocation || "Detecting location...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        toast.success(t.settings?.locationDetected || "Location detected successfully");
      },
      (err) => {
        console.error("Error getting location:", err);
        let errorMessage = t.settings?.locationNotAvailable || "Unable to detect location";
        if (err.code === 1) {
          errorMessage = t.settings?.locationAccessDenied || "Location access denied";
        }
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleConfirm = () => {
    if (position) {
      onLocationSelect(position[0], position[1]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-center pointer-events-none">
        <Button 
          onClick={onClose}
          variant="secondary"
          className="rounded-full shadow-lg pointer-events-auto bg-white/90 backdrop-blur-sm hover:bg-white"
        >
          {t.common.cancel}
        </Button>
      </div>

      <div className="flex-1 relative z-0">
        <MapContainer
          center={position || [25.2854, 51.5310]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>

        <Button
          className="absolute bottom-24 right-4 z-[1000] rounded-full w-12 h-12 p-0 shadow-lg"
          onClick={handleCurrentLocation}
          variant="secondary"
        >
          <Navigation className="w-5 h-5 text-primary" />
        </Button>
      </div>

      <div className="bg-background/90 backdrop-blur-md p-4 pb-8 border-t border-border z-[1000]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
             <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {position ? `${position[0].toFixed(6)}, ${position[1].toFixed(6)}` : (language === 'ar' ? "اختر موقعاً" : "Select location")}
            </p>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? "اسحب الدبوس أو اضغط على الخريطة" : "Drag pin or tap map"}
            </p>
          </div>
        </div>
        <Button 
          onClick={handleConfirm}
          className="w-full h-12 text-base font-semibold rounded-xl"
          disabled={!position}
        >
          {t.common.confirm}
        </Button>
      </div>
    </div>
  );
};
