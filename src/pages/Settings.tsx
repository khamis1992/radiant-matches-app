import { useState } from "react";
import { ArrowLeft, Bell, Lock, User, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const Settings = () => {
  const navigate = useNavigate();
  
  // Notification settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [bookingReminders, setBookingReminders] = useState(true);
  const [promotionalEmails, setPromotionalEmails] = useState(false);
  
  // Privacy settings
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [showBookingHistory, setShowBookingHistory] = useState(false);
  const [shareDataAnalytics, setShareDataAnalytics] = useState(true);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Settings</h1>
          </div>
        </div>
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* Notifications Section */}
        <section className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications" className="text-foreground font-medium">
                  Push Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications on your device
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="text-foreground font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates via email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="booking-reminders" className="text-foreground font-medium">
                  Booking Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get reminded about upcoming bookings
                </p>
              </div>
              <Switch
                id="booking-reminders"
                checked={bookingReminders}
                onCheckedChange={setBookingReminders}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="promotional-emails" className="text-foreground font-medium">
                  Promotional Emails
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive offers and promotions
                </p>
              </div>
              <Switch
                id="promotional-emails"
                checked={promotionalEmails}
                onCheckedChange={setPromotionalEmails}
              />
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Privacy</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="profile-visibility" className="text-foreground font-medium">
                  Public Profile
                </Label>
                <p className="text-sm text-muted-foreground">
                  Make your profile visible to others
                </p>
              </div>
              <Switch
                id="profile-visibility"
                checked={profileVisibility}
                onCheckedChange={setProfileVisibility}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="booking-history" className="text-foreground font-medium">
                  Show Booking History
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow artists to see your past bookings
                </p>
              </div>
              <Switch
                id="booking-history"
                checked={showBookingHistory}
                onCheckedChange={setShowBookingHistory}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="data-analytics" className="text-foreground font-medium">
                  Share Analytics Data
                </Label>
                <p className="text-sm text-muted-foreground">
                  Help improve our services
                </p>
              </div>
              <Switch
                id="data-analytics"
                checked={shareDataAnalytics}
                onCheckedChange={setShareDataAnalytics}
              />
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center gap-3 p-5 pb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Account</h2>
          </div>
          
          <div className="px-5 pb-5 space-y-1">
            <button className="w-full flex items-center justify-between py-3 hover:bg-muted/50 transition-colors rounded-lg px-2 -mx-2">
              <span className="text-foreground font-medium">Change Password</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            
            <Separator />
            
            <button className="w-full flex items-center justify-between py-3 hover:bg-muted/50 transition-colors rounded-lg px-2 -mx-2">
              <span className="text-foreground font-medium">Linked Accounts</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            
            <Separator />
            
            <button className="w-full flex items-center justify-between py-3 hover:bg-muted/50 transition-colors rounded-lg px-2 -mx-2">
              <span className="text-foreground font-medium">Language</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">English</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </button>
            
            <Separator />
            
            <button className="w-full flex items-center justify-between py-3 hover:bg-destructive/10 transition-colors rounded-lg px-2 -mx-2">
              <span className="text-destructive font-medium">Delete Account</span>
              <ChevronRight className="w-5 h-5 text-destructive" />
            </button>
          </div>
        </section>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Settings;
