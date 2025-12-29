import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Briefcase, LogOut, Star, MessageSquare, Phone, MapPin, Clock, CalendarOff, X, Plus } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useCurrentArtist, useUpdateArtistProfile } from "@/hooks/useArtistDashboard";
import { useArtistReviews } from "@/hooks/useReviews";
import { useWorkingHours, useUpdateWorkingHours, WorkingHourUpdate } from "@/hooks/useWorkingHours";
import { useBlockedDates, useAddBlockedDate, useRemoveBlockedDate } from "@/hooks/useBlockedDates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { validateQatarPhone, formatQatarPhone, normalizeQatarPhone } from "@/lib/phoneValidation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const ArtistProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useProfile();
  const { data: artist, isLoading: artistLoading } = useCurrentArtist();
  const updateProfile = useUpdateArtistProfile();
  const { data: reviews = [], isLoading: reviewsLoading } = useArtistReviews(artist?.id);
  const { data: workingHoursData = [] } = useWorkingHours(artist?.id);
  const updateWorkingHours = useUpdateWorkingHours();
  const { data: blockedDates = [] } = useBlockedDates(artist?.id);
  const addBlockedDate = useAddBlockedDate();
  const removeBlockedDate = useRemoveBlockedDate();
  const { t } = useLanguage();

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    bio: "",
    experience_years: 0,
    studio_address: "",
    is_available: true,
  });
  
  // Phone number state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  
  // Location state
  const [selectedLocation, setSelectedLocation] = useState("");
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  // Working hours state
  const dayNames = [
    t.settings.sunday,
    t.settings.monday,
    t.settings.tuesday,
    t.settings.wednesday,
    t.settings.thursday,
    t.settings.friday,
    t.settings.saturday,
  ];

  const defaultWorkingHours: WorkingHourUpdate[] = Array.from({ length: 7 }, (_, i) => ({
    day_of_week: i,
    is_working: i !== 5, // Friday off by default
    start_time: "09:00",
    end_time: "18:00",
  }));

  const [workingHours, setWorkingHours] = useState<WorkingHourUpdate[]>(defaultWorkingHours);
  const [isUpdatingHours, setIsUpdatingHours] = useState(false);

  // Blocked dates state
  const [blockedDatePopoverOpen, setBlockedDatePopoverOpen] = useState(false);
  const [newBlockedDate, setNewBlockedDate] = useState<Date | undefined>(undefined);
  const [blockReason, setBlockReason] = useState("");

  // Qatar cities
  const qatarCities = [
    "Doha",
    "Al Wakrah",
    "Al Khor",
    "Al Rayyan",
    "Umm Salal",
    "Al Daayen",
    "Al Shamal",
    "Al Shahaniya",
    "Lusail",
    "Mesaieed",
    "Dukhan",
  ];

  // Time options
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return [`${hour}:00`, `${hour}:30`];
  }).flat();

  // Initialize phone number and location from profile
  useEffect(() => {
    if (profile?.phone) {
      setPhoneNumber(formatQatarPhone(profile.phone));
    }
    if (profile?.location) {
      setSelectedLocation(profile.location);
    }
  }, [profile?.phone, profile?.location]);

  // Initialize working hours from database
  useEffect(() => {
    if (workingHoursData.length > 0) {
      const hoursMap = new Map(workingHoursData.map((h) => [h.day_of_week, h]));
      const merged = defaultWorkingHours.map((d) => {
        const existing = hoursMap.get(d.day_of_week);
        if (existing) {
          return {
            day_of_week: existing.day_of_week,
            is_working: existing.is_working,
            start_time: existing.start_time?.slice(0, 5) || "09:00",
            end_time: existing.end_time?.slice(0, 5) || "18:00",
          };
        }
        return d;
      });
      setWorkingHours(merged);
    }
  }, [workingHoursData]);

  if (authLoading || artistLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <Skeleton className="h-6 w-40" />
        </header>
        <div className="px-5 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!user || !artist) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <h1 className="text-xl font-bold text-foreground">{t.artistProfile.title}</h1>
        </header>
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">{t.artistProfile.notAnArtist}</h2>
          <p className="text-muted-foreground mb-6">{t.artistProfile.noArtistProfile}</p>
          <Button onClick={() => navigate("/home")}>{t.artistProfile.goHome}</Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const handleProfileEdit = () => {
    setProfileForm({
      bio: artist.bio || "",
      experience_years: artist.experience_years || 0,
      studio_address: artist.studio_address || "",
      is_available: artist.is_available ?? true,
    });
    setEditingProfile(true);
  };

  const handleProfileSave = async () => {
    try {
      await updateProfile.mutateAsync(profileForm);
      toast.success(t.artistProfile.profileUpdated);
      setEditingProfile(false);
    } catch (error) {
      toast.error(t.artistProfile.profileUpdateFailed);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const handlePhoneBlur = async () => {
    const trimmedPhone = phoneNumber.trim();
    
    if (trimmedPhone === "" || trimmedPhone === formatQatarPhone(profile?.phone)) {
      setPhoneError("");
      return;
    }

    if (!validateQatarPhone(trimmedPhone)) {
      setPhoneError(t.settings.invalidQatarPhone);
      return;
    }

    setPhoneError("");
    setIsUpdatingPhone(true);

    try {
      const normalizedPhone = normalizeQatarPhone(trimmedPhone);
      const { error } = await supabase
        .from("profiles")
        .update({ phone: normalizedPhone })
        .eq("id", user?.id);

      if (error) throw error;
      
      setPhoneNumber(formatQatarPhone(normalizedPhone));
      toast.success(t.settings.phoneUpdated);
    } catch (error) {
      console.error("Error updating phone:", error);
      toast.error(t.settings.phoneUpdateFailed);
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const handleLocationChange = async (city: string) => {
    setSelectedLocation(city);
    setIsUpdatingLocation(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ location: city })
        .eq("id", user?.id);

      if (error) throw error;
      
      toast.success(t.settings.locationUpdated);
    } catch (error) {
      console.error("Error updating location:", error);
      toast.error(t.settings.locationUpdateFailed);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const handleWorkingHourChange = (
    dayIndex: number,
    field: "is_working" | "start_time" | "end_time",
    value: boolean | string
  ) => {
    setWorkingHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayIndex ? { ...h, [field]: value } : h
      )
    );
  };

  const handleSaveWorkingHours = async () => {
    if (!artist?.id) return;
    
    setIsUpdatingHours(true);
    try {
      await updateWorkingHours.mutateAsync({
        artistId: artist.id,
        hours: workingHours,
      });
      toast.success(t.settings.workingHoursUpdated);
    } catch (error) {
      console.error("Error updating working hours:", error);
      toast.error(t.settings.workingHoursUpdateFailed);
    } finally {
      setIsUpdatingHours(false);
    }
  };

  const handleAddBlockedDate = async () => {
    if (!artist?.id || !newBlockedDate) return;
    
    try {
      await addBlockedDate.mutateAsync({
        artistId: artist.id,
        date: newBlockedDate,
        reason: blockReason || undefined,
      });
      toast.success(t.blockedDates.dateBlocked);
      setNewBlockedDate(undefined);
      setBlockReason("");
      setBlockedDatePopoverOpen(false);
    } catch (error) {
      console.error("Error blocking date:", error);
      toast.error(t.blockedDates.dateBlockFailed);
    }
  };

  const handleRemoveBlockedDate = async (blockedDateId: string) => {
    if (!artist?.id) return;
    
    try {
      await removeBlockedDate.mutateAsync({
        blockedDateId,
        artistId: artist.id,
      });
      toast.success(t.blockedDates.dateUnblocked);
    } catch (error) {
      console.error("Error unblocking date:", error);
      toast.error(t.blockedDates.dateUnblockFailed);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
        <h1 className="text-xl font-bold text-foreground">{t.artistProfile.title}</h1>
      </header>

      <div className="px-5 py-4 space-y-4">
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{t.artistProfile.artistProfile}</h2>
            {!editingProfile && (
              <Button variant="outline" size="sm" onClick={handleProfileEdit}>
                <Pencil className="w-4 h-4 mr-1" />
                {t.artistProfile.edit}
              </Button>
            )}
          </div>

          {editingProfile ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bio">{t.artistProfile.bio}</Label>
                <Textarea
                  id="bio"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder={t.artistProfile.tellClientsAboutYourself}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="experience">{t.artistProfile.yearsOfExperience}</Label>
                <Input
                  id="experience"
                  type="number"
                  value={profileForm.experience_years}
                  onChange={(e) => setProfileForm({ ...profileForm, experience_years: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="studio">{t.artistProfile.studioAddress}</Label>
                <Input
                  id="studio"
                  value={profileForm.studio_address}
                  onChange={(e) => setProfileForm({ ...profileForm, studio_address: e.target.value })}
                  placeholder={t.artistProfile.yourStudioLocation}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="available">{t.artistProfile.availableForBookings}</Label>
                <Switch
                  id="available"
                  checked={profileForm.is_available}
                  onCheckedChange={(checked) => setProfileForm({ ...profileForm, is_available: checked })}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditingProfile(false)}>
                  {t.common.cancel}
                </Button>
                <Button className="flex-1" onClick={handleProfileSave}>
                  {t.artistProfile.saveChanges}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{t.artistProfile.bio}</p>
                <p className="text-foreground mt-1">{artist.bio || t.artistProfile.noBioAdded}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t.artistProfile.experience}</p>
                  <p className="text-foreground mt-1">{artist.experience_years || 0} {t.artistProfile.years}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.artistProfile.status}</p>
                  <p className="text-foreground mt-1">{artist.is_available ? t.artistProfile.available : t.artistProfile.unavailable}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.artistProfile.studioAddress}</p>
                <p className="text-foreground mt-1">{artist.studio_address || t.artistProfile.notSet}</p>
              </div>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{t.artistProfile.reviews}</h2>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span>{artist.rating?.toFixed(1) || "0.0"}</span>
              <span>({artist.total_reviews || 0})</span>
            </div>
          </div>

          {reviewsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t.artistProfile.noReviews}</p>
              <p className="text-sm text-muted-foreground mt-1">{t.artistProfile.completeBookingsForReviews}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={review.customer_profile?.avatar_url || ""} />
                      <AvatarFallback>
                        {review.customer_profile?.full_name?.charAt(0) || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground truncate">
                          {review.customer_profile?.full_name || "Customer"}
                        </p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.rating
                                  ? "fill-primary text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(review.created_at), "MMM d, yyyy")}
                      </p>
                      {review.comment && (
                        <p className="text-sm text-foreground mt-2">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t.artistProfile.accountInfo}</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">{t.artistProfile.name}</p>
              <p className="text-foreground">{profile?.full_name || t.artistProfile.notSet}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.artistProfile.email}</p>
              <p className="text-foreground">{profile?.email || user?.email}</p>
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {t.settings.phoneNumber}
              </Label>
              <Input
                id="phone"
                type="tel"
                dir="ltr"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onBlur={handlePhoneBlur}
                placeholder={t.settings.phonePlaceholder}
                className={`mt-1 ${phoneError ? "border-destructive" : ""}`}
                disabled={isUpdatingPhone}
              />
              {phoneError && (
                <p className="text-xs text-destructive mt-1">{phoneError}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{t.settings.phoneNumberDesc}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {t.settings.location}
              </Label>
              <Select 
                value={selectedLocation} 
                onValueChange={handleLocationChange}
                disabled={isUpdatingLocation}
              >
                <SelectTrigger className="mt-1 w-full">
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
              <p className="text-xs text-muted-foreground mt-1">{t.settings.locationDesc}</p>
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {t.settings.workingHours}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">{t.settings.workingHoursDesc}</p>
            </div>
            <Button 
              size="sm" 
              onClick={handleSaveWorkingHours}
              disabled={isUpdatingHours}
            >
              {isUpdatingHours ? t.common.loading : t.common.save}
            </Button>
          </div>
          <div className="space-y-3">
            {workingHours.map((day, index) => (
              <div key={day.day_of_week} className="flex items-center gap-3">
                <div className="w-24 flex-shrink-0">
                  <Label className="text-sm font-medium">{dayNames[index]}</Label>
                </div>
                <Switch
                  checked={day.is_working}
                  onCheckedChange={(checked) =>
                    handleWorkingHourChange(day.day_of_week, "is_working", checked)
                  }
                />
                {day.is_working ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Select
                      value={day.start_time}
                      onValueChange={(value) =>
                        handleWorkingHourChange(day.day_of_week, "start_time", value)
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50 max-h-48">
                        {timeOptions.map((time) => (
                          <SelectItem key={`start-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">{t.settings.to}</span>
                    <Select
                      value={day.end_time}
                      onValueChange={(value) =>
                        handleWorkingHourChange(day.day_of_week, "end_time", value)
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50 max-h-48">
                        {timeOptions.map((time) => (
                          <SelectItem key={`end-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">{t.settings.closed}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Blocked Dates */}
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <CalendarOff className="w-5 h-5" />
                {t.blockedDates.title}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">{t.blockedDates.description}</p>
            </div>
            <Popover open={blockedDatePopoverOpen} onOpenChange={setBlockedDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  {t.blockedDates.addDate}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="end">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">{t.blockedDates.selectDate}</Label>
                    <Calendar
                      mode="single"
                      selected={newBlockedDate}
                      onSelect={setNewBlockedDate}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      className={cn("p-3 pointer-events-auto mt-2")}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t.blockedDates.reason}</Label>
                    <Input
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder={t.blockedDates.reasonPlaceholder}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={handleAddBlockedDate} 
                    disabled={!newBlockedDate || addBlockedDate.isPending}
                    className="w-full"
                  >
                    {addBlockedDate.isPending ? t.common.loading : t.blockedDates.addDate}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {blockedDates.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CalendarOff className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t.blockedDates.noBlockedDates}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {blockedDates.map((blockedDate) => (
                <div
                  key={blockedDate.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {format(new Date(blockedDate.blocked_date), "EEEE, MMMM d, yyyy")}
                    </p>
                    {blockedDate.reason && (
                      <p className="text-xs text-muted-foreground mt-0.5">{blockedDate.reason}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveBlockedDate(blockedDate.id)}
                    disabled={removeBlockedDate.isPending}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
              <AlertDialogDescription>
                You will need to sign in again to access your artist dashboard.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSignOut} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Log Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ArtistProfilePage;
