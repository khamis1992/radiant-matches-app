import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import ArtistHeader from "@/components/artist/ArtistHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";
import PortfolioUpload from "@/components/PortfolioUpload";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentArtist } from "@/hooks/useArtistDashboard";

const ArtistGallery = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: artist, isLoading: artistLoading } = useCurrentArtist();

  if (authLoading || artistLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <Skeleton className="h-6 w-40" />
        </header>
        <div className="px-5 py-6 space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!user || !artist) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <h1 className="text-xl font-bold text-foreground">Gallery</h1>
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <ArtistHeader />

      <div className="px-5 py-4">
        <PortfolioUpload artistId={artist.id} />
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ArtistGallery;
