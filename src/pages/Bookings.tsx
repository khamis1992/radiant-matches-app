import BottomNavigation from "@/components/BottomNavigation";
import { Calendar, Clock, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

import artist1 from "@/assets/artist-1.jpg";
import artist2 from "@/assets/artist-2.jpg";

const upcomingBookings = [
  {
    id: "1",
    artist: "Sofia Chen",
    artistImage: artist1,
    service: "Bridal Makeup",
    date: "Dec 28, 2025",
    time: "10:00 AM",
    location: "Artist's Studio",
    status: "confirmed",
    price: 350,
  },
];

const pastBookings = [
  {
    id: "2",
    artist: "Elena Rodriguez",
    artistImage: artist2,
    service: "Party Glam",
    date: "Dec 15, 2025",
    time: "6:00 PM",
    location: "Your Location",
    status: "completed",
    price: 120,
  },
];

const Bookings = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
        <h1 className="text-xl font-bold text-foreground">My Bookings</h1>
      </header>

      <div className="px-5 py-6">
        {/* Upcoming */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Upcoming</h2>
          {upcomingBookings.length > 0 ? (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-card rounded-2xl border border-border p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={booking.artistImage}
                      alt={booking.artist}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">{booking.artist}</h3>
                        <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                          Confirmed
                        </span>
                      </div>
                      <p className="text-sm text-primary mt-0.5">{booking.service}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{booking.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{booking.time}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{booking.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <Button variant="outline" size="sm" className="flex-1">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Message
                    </Button>
                    <Button variant="soft" size="sm" className="flex-1">
                      Reschedule
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No upcoming bookings</p>
            </div>
          )}
        </section>

        {/* Past */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Past</h2>
          <div className="space-y-4">
            {pastBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-card rounded-2xl border border-border p-4 shadow-sm opacity-80"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={booking.artistImage}
                    alt={booking.artist}
                    className="w-14 h-14 rounded-full object-cover grayscale"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{booking.artist}</h3>
                      <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                        Completed
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{booking.service}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{booking.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{booking.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Button variant="outline" size="sm" className="flex-1">
                    Leave Review
                  </Button>
                  <Button variant="soft" size="sm" className="flex-1">
                    Book Again
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Bookings;
