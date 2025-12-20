import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Pencil, Briefcase, LogOut } from "lucide-react";
import PortfolioUpload from "@/components/PortfolioUpload";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useCurrentArtist, useUpdateArtistProfile } from "@/hooks/useArtistDashboard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ArtistProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useProfile();
  const { data: artist, isLoading: artistLoading } = useCurrentArtist();
  const updateProfile = useUpdateArtistProfile();

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    bio: "",
    experience_years: 0,
    studio_address: "",
    is_available: true,
  });

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
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="text-foreground">{profile?.location || "Not set"}</p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <Button 
          variant="outline" 
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ArtistProfilePage;
