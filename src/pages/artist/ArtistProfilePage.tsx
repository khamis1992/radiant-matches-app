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
import { Pencil, Briefcase, LogOut, Star, MessageSquare, Phone, MapPin } from "lucide-react";
import PortfolioUpload from "@/components/PortfolioUpload";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useCurrentArtist, useUpdateArtistProfile } from "@/hooks/useArtistDashboard";
import { useArtistReviews } from "@/hooks/useReviews";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { validateQatarPhone, formatQatarPhone, normalizeQatarPhone } from "@/lib/phoneValidation";
import { useLanguage } from "@/contexts/LanguageContext";

const ArtistProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useProfile();
  const { data: artist, isLoading: artistLoading } = useCurrentArtist();
  const updateProfile = useUpdateArtistProfile();
  const { data: reviews = [], isLoading: reviewsLoading } = useArtistReviews(artist?.id);
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

  // Initialize phone number and location from profile
  useEffect(() => {
    if (profile?.phone) {
      setPhoneNumber(formatQatarPhone(profile.phone));
    }
    if (profile?.location) {
      setSelectedLocation(profile.location);
    }
  }, [profile?.phone, profile?.location]);

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
          <h1 className="text-xl font-bold text-foreground">Profile</h1>
        </header>
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Not an Artist</h2>
          <p className="text-muted-foreground mb-6">You don't have an artist profile yet</p>
          <Button onClick={() => navigate("/home")}>Go Home</Button>
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
      toast.success("Profile updated");
      setEditingProfile(false);
    } catch (error) {
      toast.error("Failed to update profile");
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
        <h1 className="text-xl font-bold text-foreground">Profile</h1>
      </header>

      <div className="px-5 py-4 space-y-4">
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Artist Profile</h2>
            {!editingProfile && (
              <Button variant="outline" size="sm" onClick={handleProfileEdit}>
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>

          {editingProfile ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="Tell clients about yourself..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  value={profileForm.experience_years}
                  onChange={(e) => setProfileForm({ ...profileForm, experience_years: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="studio">Studio Address</Label>
                <Input
                  id="studio"
                  value={profileForm.studio_address}
                  onChange={(e) => setProfileForm({ ...profileForm, studio_address: e.target.value })}
                  placeholder="Your studio location"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="available">Available for Bookings</Label>
                <Switch
                  id="available"
                  checked={profileForm.is_available}
                  onCheckedChange={(checked) => setProfileForm({ ...profileForm, is_available: checked })}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditingProfile(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleProfileSave}>
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Bio</p>
                <p className="text-foreground mt-1">{artist.bio || "No bio added"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Experience</p>
                  <p className="text-foreground mt-1">{artist.experience_years || 0} years</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-foreground mt-1">{artist.is_available ? "Available" : "Unavailable"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Studio Address</p>
                <p className="text-foreground mt-1">{artist.studio_address || "Not set"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Portfolio Section */}
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <PortfolioUpload artistId={artist.id} />
        </div>

        {/* Reviews Section */}
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Reviews</h2>
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
              <p className="text-muted-foreground">No reviews yet</p>
              <p className="text-sm text-muted-foreground mt-1">Complete bookings to receive reviews</p>
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
          <h2 className="text-lg font-semibold text-foreground mb-4">Account Info</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="text-foreground">{profile?.full_name || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
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
