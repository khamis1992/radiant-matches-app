import { Bell } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import CategoryCard from "@/components/CategoryCard";
import ArtistCard from "@/components/ArtistCard";
import BottomNavigation from "@/components/BottomNavigation";
import { useArtists } from "@/hooks/useArtists";
import { Skeleton } from "@/components/ui/skeleton";

import categoryBridal from "@/assets/category-bridal.jpg";
import categoryParty from "@/assets/category-party.jpg";
import categoryPhotoshoot from "@/assets/category-photoshoot.jpg";
import categoryNatural from "@/assets/category-natural.jpg";

import artist1 from "@/assets/artist-1.jpg";

const categories = [
  { name: "Bridal", image: categoryBridal },
  { name: "Party", image: categoryParty },
  { name: "Photoshoot", image: categoryPhotoshoot },
  { name: "Natural", image: categoryNatural },
];

const Home = () => {
  const { data: artists, isLoading } = useArtists();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <h1 className="text-xl font-bold text-foreground">
                Find Your Artist ✨
              </h1>
            </div>
            <button className="relative p-2 rounded-full bg-card border border-border hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </button>
          </div>
          <SearchBar />
        </div>
      </header>

      {/* Categories */}
      <section className="px-5 py-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Browse by Category
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
          {categories.map((category) => (
            <CategoryCard
              key={category.name}
              name={category.name}
              image={category.image}
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
        <div className="grid gap-4">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden shadow-md">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-40" />
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
                  rating={Number(artist.rating) || 0}
                  reviews={artist.total_reviews || 0}
                  specialty={artist.bio?.split(".")[0] || "Makeup Artist"}
                  price={0} // Will be fetched from services
                  location={artist.profile?.location || artist.studio_address || "Location TBD"}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
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
