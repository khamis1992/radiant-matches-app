import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import CategoryCard from "@/components/CategoryCard";
import ArtistCard from "@/components/ArtistCard";
import BottomNavigation from "@/components/BottomNavigation";
import { useArtists } from "@/hooks/useArtists";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import logoImage from "@/assets/logo.png";
import artist1 from "@/assets/artist-1.jpg";
import categoryMakeup from "@/assets/category-makeup.jpg";
import categoryHairstyling from "@/assets/category-hairstyling.jpg";
import categoryHenna from "@/assets/category-henna.jpg";
import categoryLashes from "@/assets/category-lashes.jpg";
import categoryNails from "@/assets/category-nails.jpg";
import categoryBridal from "@/assets/category-bridal.jpg";
import categoryPhotoshoot from "@/assets/category-photoshoot.jpg";

const categories = [
  { name: "Makeup", image: categoryMakeup },
  { name: "Hair Styling", image: categoryHairstyling },
  { name: "Henna", image: categoryHenna },
  { name: "Lashes & Brows", image: categoryLashes },
  { name: "Nails", image: categoryNails },
  { name: "Bridal", image: categoryBridal },
  { name: "Photoshoot", image: categoryPhotoshoot },
];

const Home = () => {
  const navigate = useNavigate();
  const { isArtist, loading: roleLoading } = useUserRole();
  const { data: artists, isLoading } = useArtists();
  const { data: profile } = useProfile();

  useEffect(() => {
    if (!roleLoading && isArtist) {
      navigate("/artist-dashboard", { replace: true });
    }
  }, [isArtist, roleLoading, navigate]);

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  if (isArtist) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <img src={logoImage} alt="Glam" className="h-10 w-auto" />
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate("/messages")}
                className="relative p-2 rounded-full bg-card border border-border hover:bg-muted transition-colors"
              >
                <Bell className="w-5 h-5 text-foreground" />
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary rounded-full flex items-center justify-center text-[10px] font-semibold text-primary-foreground">
                  3
                </span>
              </button>
              <button 
                onClick={() => navigate("/profile")}
                className="rounded-full border-2 border-primary/20 hover:border-primary transition-colors"
              >
                <Avatar className="w-9 h-9">
                  <AvatarImage 
                    src={profile?.avatar_url || undefined} 
                    alt={profile?.full_name || "Profile"} 
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {profile?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          </div>
          <SearchBar />
        </div>
      </header>

      {/* Categories */}
      <section className="px-5 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Browse by Category
          </h2>
          <button 
            onClick={() => navigate("/categories")}
            className="text-sm text-primary font-medium hover:underline"
          >
            See All
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
          {categories.map((category) => (
            <CategoryCard
              key={category.name}
              name={category.name}
              image={category.image}
              onClick={() => navigate("/categories")}
            />
          ))}
        </div>
      </section>

      {/* Featured Artists */}
      <section className="px-5 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Top Rated Artists
          </h2>
          <button className="text-sm text-primary font-medium hover:underline">
            See All
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden shadow-md">
                  <Skeleton className="h-32 w-full" />
                  <div className="flex justify-center -mt-10">
                    <Skeleton className="w-20 h-20 rounded-full" />
                  </div>
                  <div className="p-4 pt-3 space-y-2 flex flex-col items-center">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-10 w-full mt-2" />
                  </div>
                </div>
              ))}
            </>
          ) : artists && artists.length > 0 ? (
            artists.map((artist, index) => (
              <div
                key={artist.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ArtistCard
                  id={artist.id}
                  name={artist.profile?.full_name || "Unknown Artist"}
                  image={artist.profile?.avatar_url || artist1}
                  featuredImage={artist.featured_image}
                  rating={Number(artist.rating) || 0}
                  reviews={artist.total_reviews || 0}
                  specialty="Make-Up Artist"
                  price={0}
                  location={artist.profile?.location || artist.studio_address || "Location TBD"}
                  tagline={artist.bio?.split(".")[0] || undefined}
                  categories={artist.categories}
                />
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              <p>No artists available yet</p>
            </div>
          )}
        </div>
      </section>

      <BottomNavigation />
    </div>
  );
};

export default Home;
