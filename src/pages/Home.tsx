import { Bell } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import CategoryCard from "@/components/CategoryCard";
import ArtistCard from "@/components/ArtistCard";
import BottomNavigation from "@/components/BottomNavigation";

import categoryBridal from "@/assets/category-bridal.jpg";
import categoryParty from "@/assets/category-party.jpg";
import categoryPhotoshoot from "@/assets/category-photoshoot.jpg";
import categoryNatural from "@/assets/category-natural.jpg";

import artist1 from "@/assets/artist-1.jpg";
import artist2 from "@/assets/artist-2.jpg";
import artist3 from "@/assets/artist-3.jpg";

const categories = [
  { name: "Bridal", image: categoryBridal },
  { name: "Party", image: categoryParty },
  { name: "Photoshoot", image: categoryPhotoshoot },
  { name: "Natural", image: categoryNatural },
];

const featuredArtists = [
  {
    id: "1",
    name: "Sofia Chen",
    image: artist1,
    rating: 4.9,
    reviews: 127,
    specialty: "Bridal & Wedding",
    price: 150,
    location: "Manhattan, NY",
  },
  {
    id: "2",
    name: "Elena Rodriguez",
    image: artist2,
    rating: 4.8,
    reviews: 98,
    specialty: "Party & Events",
    price: 120,
    location: "Brooklyn, NY",
  },
  {
    id: "3",
    name: "Mia Thompson",
    image: artist3,
    rating: 4.7,
    reviews: 85,
    specialty: "Natural & Everyday",
    price: 85,
    location: "Queens, NY",
  },
];

const Home = () => {
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
          {featuredArtists.map((artist, index) => (
            <div
              key={artist.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ArtistCard {...artist} />
            </div>
          ))}
        </div>
      </section>

      <BottomNavigation />
    </div>
  );
};

export default Home;
