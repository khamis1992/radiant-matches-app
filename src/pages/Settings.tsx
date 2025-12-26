import { useState, useEffect } from "react";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { Bell, Lock, User, ChevronRight, Eye, EyeOff, Globe, Phone, MapPin, AlertTriangle, Link2, Crosshair, Loader2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Language } from "@/lib/translations";
import { useProfile } from "@/hooks/useProfile";
import { validateQatarPhone, normalizeQatarPhone, formatQatarPhone } from "@/lib/phoneValidation";
import { useQueryClient } from "@tanstack/react-query";

type PasswordFormValues = {
  newPassword: string;
  confirmPassword: string;
};

const Settings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [linkedAccountsDialogOpen, setLinkedAccountsDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Qatar cities with coordinates
  const qatarCitiesWithCoords = [
    { name: "Doha", lat: 25.2854, lng: 51.5310 },
    { name: "Al Wakrah", lat: 25.1659, lng: 51.5972 },
    { name: "Al Khor", lat: 25.6804, lng: 51.4969 },
    { name: "Al Rayyan", lat: 25.2919, lng: 51.4244 },
    { name: "Umm Salal", lat: 25.4106, lng: 51.4042 },
    { name: "Al Daayen", lat: 25.4390, lng: 51.4816 },
    { name: "Al Shamal", lat: 26.1164, lng: 51.2159 },
    { name: "Al Shahaniya", lat: 25.3106, lng: 51.2091 },
    { name: "Lusail", lat: 25.4300, lng: 51.4900 },
    { name: "Mesaieed", lat: 24.9903, lng: 51.5483 },
    { name: "Dukhan", lat: 25.4284, lng: 50.7816 },
  ];
  
  const qatarCities = qatarCitiesWithCoords.map(city => city.name);
  
  const { settings, isLoading, updateSettings } = useUserSettings();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { t, language, setLanguage, languageNames } = useLanguage();

  // Initialize phone number and location from profile
  useEffect(() => {
    if (profile?.phone) {
      setPhoneNumber(formatQatarPhone(profile.phone));
    }
    if (profile?.location) {
      setSelectedLocation(profile.location);
    }
  }, [profile]);

  useSwipeBack();

  const passwordSchema = z.object({
    newPassword: z.string().min(6, t.settings.passwordMinLength),
    confirmPassword: z.string().min(6, t.settings.passwordMinLength),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t.settings.passwordsNoMatch,
    path: ["confirmPassword"],
  });

  type PasswordFormValues = z.infer<typeof passwordSchema>;

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmitPassword = async (values: PasswordFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t.settings.passwordUpdated);
        setPasswordDialogOpen(false);
        form.reset();
      }
    } catch (error) {
      toast.error(t.settings.unexpectedError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneBlur = async () => {
    setPhoneError("");
    
    const trimmedPhone = phoneNumber.trim();
    
    // Allow empty phone
    if (!trimmedPhone) {
      await updatePhoneInDatabase(null);
      return;
    }
    
    const normalizedPhone = normalizeQatarPhone(trimmedPhone);
    
    if (!validateQatarPhone(normalizedPhone)) {
      setPhoneError(t.settings.invalidQatarPhone);
      return;
    }
    
    await updatePhoneInDatabase(normalizedPhone);
  };

  const updatePhoneInDatabase = async (phone: string | null) => {
    setIsUpdatingPhone(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ phone })
        .eq("id", user.id);

      if (error) {
        toast.error(t.settings.phoneUpdateFailed);
        return;
      }

      // Update local display with formatted phone
      if (phone) {
        setPhoneNumber(formatQatarPhone(phone));
      }
      
      // Invalidate profile cache
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(t.settings.phoneUpdated);
    } catch (error) {
      toast.error(t.settings.phoneUpdateFailed);
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const handleLocationChange = async (city: string) => {
    setSelectedLocation(city);
    setIsUpdatingLocation(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ location: city })
        .eq("id", user.id);

      if (error) {
        toast.error(t.settings.locationUpdateFailed);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(t.settings.locationUpdated);
    } catch (error) {
      toast.error(t.settings.locationUpdateFailed);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Find closest city to given coordinates
  const findClosestCity = (lat: number, lng: number): string => {
    let closestCity = qatarCitiesWithCoords[0].name;
    let minDistance = Infinity;

    for (const city of qatarCitiesWithCoords) {
      const distance = calculateDistance(lat, lng, city.lat, city.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestCity = city.name;
      }
    }

    return closestCity;
  };

  // Detect current location using browser Geolocation API
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t.settings.locationNotAvailable);
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const closestCity = findClosestCity(latitude, longitude);
        
        // Update the location
        await handleLocationChange(closestCity);
        toast.success(t.settings.locationDetected);
        setIsDetectingLocation(false);
      },
      (error) => {
        setIsDetectingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error(t.settings.locationAccessDenied);
        } else {
          toast.error(t.settings.locationNotAvailable);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error(t.settings.typeDeleteToConfirm);
      return;
    }

    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t.settings.unexpectedError);
        return;
      }

      const response = await supabase.functions.invoke("delete-user-account", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success(t.settings.accountDeleted);
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(t.settings.accountDeleteFailed);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-xl font-bold text-foreground">{t.settings.title}</h1>
          </div>
        </div>
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* Notifications Section */}
        <section className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{t.settings.notifications}</h2>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications" className="text-foreground font-medium">
                    {t.settings.pushNotifications}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t.settings.pushNotificationsDesc}
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.push_notifications}
                  onCheckedChange={(checked) => updateSettings({ push_notifications: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications" className="text-foreground font-medium">
                    {t.settings.emailNotifications}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t.settings.emailNotificationsDesc}
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => updateSettings({ email_notifications: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="booking-reminders" className="text-foreground font-medium">
                    {t.settings.bookingReminders}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t.settings.bookingRemindersDesc}
                  </p>
                </div>
                <Switch
                  id="booking-reminders"
                  checked={settings.booking_reminders}
                  onCheckedChange={(checked) => updateSettings({ booking_reminders: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="promotional-emails" className="text-foreground font-medium">
                    {t.settings.promotionalEmails}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t.settings.promotionalEmailsDesc}
                  </p>
                </div>
                <Switch
                  id="promotional-emails"
                  checked={settings.promotional_emails}
                  onCheckedChange={(checked) => updateSettings({ promotional_emails: checked })}
                />
              </div>
            </div>
          )}
        </section>

        {/* Privacy Section */}
        <section className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{t.settings.privacy}</h2>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="profile-visibility" className="text-foreground font-medium">
                    {t.settings.publicProfile}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t.settings.publicProfileDesc}
                  </p>
                </div>
                <Switch
                  id="profile-visibility"
                  checked={settings.profile_visibility}
                  onCheckedChange={(checked) => updateSettings({ profile_visibility: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="booking-history" className="text-foreground font-medium">
                    {t.settings.showBookingHistory}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t.settings.showBookingHistoryDesc}
                  </p>
                </div>
                <Switch
                  id="booking-history"
                  checked={settings.show_booking_history}
                  onCheckedChange={(checked) => updateSettings({ show_booking_history: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="data-analytics" className="text-foreground font-medium">
                    {t.settings.shareAnalytics}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t.settings.shareAnalyticsDesc}
                  </p>
                </div>
                <Switch
                  id="data-analytics"
                  checked={settings.share_data_analytics}
                  onCheckedChange={(checked) => updateSettings({ share_data_analytics: checked })}
                />
              </div>
            </div>
          )}
        </section>

        {/* Phone Number Section */}
        <section className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{t.settings.phoneNumber}</h2>
          </div>
          
          {profileLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t.settings.phoneNumberDesc}
              </p>
              <Input
                type="tel"
                placeholder={t.settings.phonePlaceholder}
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setPhoneError("");
                }}
                onBlur={handlePhoneBlur}
                disabled={isUpdatingPhone}
                className={phoneError ? "border-destructive" : ""}
                dir="ltr"
              />
              {phoneError && (
                <p className="text-sm text-destructive">{phoneError}</p>
              )}
              {isUpdatingPhone && (
                <p className="text-sm text-muted-foreground">{t.settings.updating}</p>
              )}
            </div>
          )}
        </section>

        {/* Location Section */}
        <section className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{t.settings.location}</h2>
          </div>
          
          {profileLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t.settings.locationDesc}
              </p>
              
              {/* Auto-detect location button */}
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleDetectLocation}
                disabled={isDetectingLocation || isUpdatingLocation}
              >
                {isDetectingLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.settings.detectingLocation}
                  </>
                ) : (
                  <>
                    <Crosshair className="w-4 h-4" />
                    {t.settings.useCurrentLocation}
                  </>
                )}
              </Button>
              
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">{t.common.or}</span>
                <Separator className="flex-1" />
              </div>
              
              {/* Manual city selection */}
              <Select 
                value={selectedLocation} 
                onValueChange={handleLocationChange}
                disabled={isUpdatingLocation || isDetectingLocation}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t.settings.selectCity} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {qatarCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isUpdatingLocation && (
                <p className="text-sm text-muted-foreground">{t.settings.updating}</p>
              )}
            </div>
          )}
        </section>

        {/* Account Section */}
        <section className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center gap-3 p-5 pb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{t.settings.account}</h2>
          </div>
          
          <div className="px-5 pb-5 space-y-1">
            <button 
              onClick={() => setPasswordDialogOpen(true)}
              className="w-full flex items-center justify-between py-3 hover:bg-muted/50 transition-colors rounded-lg px-2 -mx-2"
            >
              <span className="text-foreground font-medium">{t.settings.changePassword}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            
            <Separator />
            
            <button 
              onClick={() => setLinkedAccountsDialogOpen(true)}
              className="w-full flex items-center justify-between py-3 hover:bg-muted/50 transition-colors rounded-lg px-2 -mx-2"
            >
              <span className="text-foreground font-medium">{t.settings.linkedAccounts}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            
            <Separator />
            
            <div className="flex items-center justify-between py-3 px-2 -mx-2">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground font-medium">{t.settings.language}</span>
              </div>
              <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{languageNames.en}</SelectItem>
                  <SelectItem value="ar">{languageNames.ar}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <button 
              onClick={() => setDeleteAccountDialogOpen(true)}
              className="w-full flex items-center justify-between py-3 hover:bg-destructive/10 transition-colors rounded-lg px-2 -mx-2"
            >
              <span className="text-destructive font-medium">{t.settings.deleteAccount}</span>
              <ChevronRight className="w-5 h-5 text-destructive" />
            </button>
          </div>
        </section>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.settings.changePassword}</DialogTitle>
            <DialogDescription>
              {t.settings.enterNewPassword}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitPassword)} className="space-y-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.settings.newPassword}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder={t.settings.enterNewPasswordPlaceholder}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.settings.confirmPassword}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder={t.settings.confirmNewPasswordPlaceholder}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setPasswordDialogOpen(false);
                    form.reset();
                  }}
                >
                  {t.common.cancel}
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? t.settings.updating : t.settings.updatePassword}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Linked Accounts Dialog */}
      <Dialog open={linkedAccountsDialogOpen} onOpenChange={setLinkedAccountsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              {t.settings.linkedAccountsTitle}
            </DialogTitle>
            <DialogDescription>
              {t.settings.linkedAccountsDesc}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Link2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              {t.settings.linkedAccountsComingSoon}
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setLinkedAccountsDialogOpen(false)}>
              {t.common.close}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={deleteAccountDialogOpen} onOpenChange={setDeleteAccountDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              {t.settings.deleteAccountTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p className="text-destructive font-medium">
                {t.settings.deleteAccountWarning}
              </p>
              <p>{t.settings.deleteAccountConfirm}</p>
              <div className="space-y-2">
                <Label htmlFor="delete-confirm">{t.settings.typeDeleteToConfirm}</Label>
                <Input
                  id="delete-confirm"
                  placeholder={t.settings.deleteAccountPlaceholder}
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="border-destructive/50 focus-visible:ring-destructive"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setDeleteConfirmation("");
                setDeleteAccountDialogOpen(false);
              }}
            >
              {t.common.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== "DELETE" || isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t.settings.deleting : t.settings.deleteAccount}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation />
    </div>
  );
};

export default Settings;
