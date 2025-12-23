import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import MakeupArtists from "./pages/MakeupArtists";
import ArtistProfile from "./pages/ArtistProfile";
import ArtistEarnings from "./pages/artist/ArtistEarnings";
import ArtistBookings from "./pages/artist/ArtistBookings";
import ArtistServices from "./pages/artist/ArtistServices";
import ArtistProfilePage from "./pages/artist/ArtistProfilePage";
import ArtistGallery from "./pages/artist/ArtistGallery";
import Booking from "./pages/Booking";
import Bookings from "./pages/Bookings";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminArtists from "./pages/admin/AdminArtists";
import AdminPromoCodes from "./pages/admin/AdminPromoCodes";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminServices from "./pages/admin/AdminServices";

const queryClient = new QueryClient();

// App component with all providers
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <NotificationPrompt />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/home" element={<Home />} />
          <Route path="/makeup-artists" element={<MakeupArtists />} />
          <Route path="/artist/:id" element={<ArtistProfile />} />
          <Route path="/artist-dashboard" element={<ArtistEarnings />} />
          <Route path="/artist-bookings" element={<ArtistBookings />} />
          <Route path="/artist-services" element={<ArtistServices />} />
          <Route path="/artist-profile" element={<ArtistProfilePage />} />
          <Route path="/artist-gallery" element={<ArtistGallery />} />
          <Route path="/booking/:id" element={<Booking />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/artists" element={<AdminArtists />} />
          <Route path="/admin/promo-codes" element={<AdminPromoCodes />} />
          <Route path="/admin/finance" element={<AdminFinance />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/services" element={<AdminServices />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
