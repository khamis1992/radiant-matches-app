import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Heart, Share2, Clock, Award, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServiceCard from "@/components/ServiceCard";
import ReviewCard from "@/components/ReviewCard";

import artist1 from "@/assets/artist-1.jpg";
import artist2 from "@/assets/artist-2.jpg";
import artist3 from "@/assets/artist-3.jpg";

import categoryBridal from "@/assets/category-bridal.jpg";
import categoryParty from "@/assets/category-party.jpg";
import categoryNatural from "@/assets/category-natural.jpg";

const artistsData: Record<string, {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  specialty: string;
  location: string;
  bio: string;
  experience: string;
  services: { name: string; description: string; duration: string; price: number }[];
  portfolio: string[];
  reviewsList: { name: string; avatar: string; rating: number; date: string; comment: string }[];
}> = {
  "1": {
    id: "1",
    name: "Sofia Chen",
    image: artist1,
    rating: 4.9,
    reviews: 127,
    specialty: "Bridal & Wedding Specialist",
    location: "Manhattan, NY",
    bio: "Award-winning bridal makeup artist with 8+ years of experience creating timeless, elegant looks for your special day.",
    experience: "8 years",
    services: [
      { name: "Bridal Makeup", description: "Complete bridal look with trial session included", duration: "3 hours", price: 350 },
      { name: "Bridesmaid Makeup", description: "Elegant makeup for the bridal party", duration: "1.5 hours", price: 120 },
      { name: "Makeup Trial", description: "Pre-wedding consultation and trial run", duration: "2 hours", price: 150 },
      { name: "Engagement Look", description: "Perfect makeup for engagement photos", duration: "1.5 hours", price: 180 },
    ],
    portfolio: [categoryBridal, categoryParty, categoryNatural],
    reviewsList: [
      { name: "Sarah M.", avatar: artist2, rating: 5, date: "2 weeks ago", comment: "Sofia made me feel like a princess on my wedding day! Her attention to detail is amazing." },
      { name: "Jennifer L.", avatar: artist3, rating: 5, date: "1 month ago", comment: "Absolutely stunning work. My makeup lasted all day and night. Highly recommend!" },
    ],
  },
  "2": {
    id: "2",
    name: "Elena Rodriguez",
    image: artist2,
    rating: 4.8,
    reviews: 98,
    specialty: "Party & Events Expert",
    location: "Brooklyn, NY",
    bio: "Creative makeup artist specializing in bold, glamorous looks for parties and special events.",
    experience: "6 years",
    services: [
      { name: "Party Glam", description: "Bold and beautiful party-ready makeup", duration: "1.5 hours", price: 120 },
      { name: "Red Carpet Look", description: "Glamorous makeup for special events", duration: "2 hours", price: 200 },
      { name: "Festival Style", description: "Creative, colorful looks for festivals", duration: "1 hour", price: 85 },
    ],
    portfolio: [categoryParty, categoryBridal, categoryNatural],
    reviewsList: [
      { name: "Amy K.", avatar: artist1, rating: 5, date: "1 week ago", comment: "Elena created the most amazing look for my birthday party! Everyone was asking who did my makeup." },
    ],
  },
  "3": {
    id: "3",
    name: "Mia Thompson",
    image: artist3,
    rating: 4.7,
    reviews: 85,
    specialty: "Natural & Everyday Beauty",
    location: "Queens, NY",
    bio: "Skincare-focused artist creating fresh, natural looks that enhance your natural beauty.",
    experience: "5 years",
    services: [
      { name: "Natural Glow", description: "Fresh, dewy everyday makeup", duration: "1 hour", price: 85 },
      { name: "No-Makeup Makeup", description: "Subtle enhancement for a polished look", duration: "45 mins", price: 65 },
      { name: "Skincare + Makeup", description: "Full skincare routine with makeup application", duration: "1.5 hours", price: 120 },
    ],
    portfolio: [categoryNatural, categoryParty, categoryBridal],
    reviewsList: [
      { name: "Lisa P.", avatar: artist2, rating: 4, date: "3 weeks ago", comment: "Perfect natural look for my work headshots. Mia is so talented!" },
    ],
  },
};

const ArtistProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  const artist = artistsData[id || "1"];

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Artist not found</p>
      </div>
    );
  }

  const handleBookService = (serviceName: string) => {
    navigate(`/booking/${id}?service=${encodeURIComponent(serviceName)}`);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header Image */}
      <div className="relative h-72">
        <img
          src={artist.image}
          alt={artist.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/20" />
        
        {/* Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-card/80 backdrop-blur-sm shadow-md"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 rounded-full bg-card/80 backdrop-blur-sm shadow-md"
            >
              <Heart
                className={`w-5 h-5 ${
                  isFavorite ? "text-primary fill-primary" : "text-foreground"
                }`}
              />
            </button>
            <button className="p-2 rounded-full bg-card/80 backdrop-blur-sm shadow-md">
              <Share2 className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-5 -mt-12 relative z-10">
        <div className="bg-card rounded-2xl p-5 shadow-lg border border-border">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{artist.name}</h1>
              <p className="text-primary font-medium mt-1">{artist.specialty}</p>
            </div>
            <div className="flex items-center gap-1 bg-accent px-3 py-1.5 rounded-full">
              <Star className="w-4 h-4 text-[hsl(42,65%,55%)] fill-[hsl(42,65%,55%)]" />
              <span className="font-semibold text-foreground">{artist.rating}</span>
              <span className="text-sm text-muted-foreground">({artist.reviews})</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{artist.location}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Award className="w-4 h-4" />
              <span className="text-sm">{artist.experience}</span>
            </div>
          </div>

          <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
            {artist.bio}
          </p>

          <div className="flex gap-3 mt-5">
            <Button className="flex-1" onClick={() => handleBookService(artist.services[0].name)}>
              Book Now
            </Button>
            <Button variant="outline" size="icon">
              <MessageCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mt-6">
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="w-full bg-muted/50 p-1 rounded-xl">
            <TabsTrigger
              value="services"
              className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              Services
            </TabsTrigger>
            <TabsTrigger
              value="portfolio"
              className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              Portfolio
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-4 space-y-3">
            {artist.services.map((service) => (
              <ServiceCard
                key={service.name}
                {...service}
                onBook={() => handleBookService(service.name)}
              />
            ))}
          </TabsContent>

          <TabsContent value="portfolio" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {artist.portfolio.map((image, index) => (
                <div
                  key={index}
                  className="aspect-[4/5] rounded-xl overflow-hidden shadow-md"
                >
                  <img
                    src={image}
                    alt={`Portfolio ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4 space-y-3">
            {artist.reviewsList.map((review, index) => (
              <ReviewCard key={index} {...review} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ArtistProfile;
