import BottomNavigation from "@/components/BottomNavigation";
import { Settings, Heart, CreditCard, Bell, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import artist3 from "@/assets/artist-3.jpg";

const menuItems = [
  { icon: Heart, label: "Favorites", href: "#" },
  { icon: CreditCard, label: "Payment Methods", href: "#" },
  { icon: Bell, label: "Notifications", href: "#" },
  { icon: Settings, label: "Settings", href: "#" },
  { icon: HelpCircle, label: "Help & Support", href: "#" },
];

const Profile = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-gradient-to-br from-primary/10 via-background to-background pt-8 pb-12 px-5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-foreground">Profile</h1>
          <button className="p-2 rounded-full hover:bg-card transition-colors">
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <img
            src={artist3}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover border-4 border-card shadow-lg"
          />
          <div>
            <h2 className="text-xl font-bold text-foreground">Jessica Williams</h2>
            <p className="text-muted-foreground">jessica@email.com</p>
            <Button variant="outline" size="sm" className="mt-2">
              Edit Profile
            </Button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-5 -mt-6">
        <div className="bg-card rounded-2xl border border-border p-4 shadow-md">
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">8</p>
              <p className="text-xs text-muted-foreground mt-1">Bookings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">5</p>
              <p className="text-xs text-muted-foreground mt-1">Reviews</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">3</p>
              <p className="text-xs text-muted-foreground mt-1">Favorites</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-5 py-6">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${
                index !== menuItems.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="flex-1 text-left font-medium text-foreground">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>

        <button className="w-full flex items-center gap-3 p-4 mt-4 bg-destructive/10 rounded-2xl hover:bg-destructive/20 transition-colors">
          <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <span className="flex-1 text-left font-medium text-destructive">Log Out</span>
        </button>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Profile;
