import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { RoleGate } from "@/components/auth/RoleGate";
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
import ArtistNotifications from "./pages/artist/ArtistNotifications";
import Booking from "./pages/Booking";
import Bookings from "./pages/Bookings";
import BookingDetails from "./pages/BookingDetails";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Favorites from "./pages/Favorites";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import HelpSupport from "./pages/HelpSupport";
import PaymentMethods from "./pages/PaymentMethods";
import PaymentResult from "./pages/PaymentResult";
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
import AdminBanners from "./pages/admin/AdminBanners";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminReports from "./pages/admin/AdminReports";
import ArtistSignup from "./pages/ArtistSignup";
import CompareArtists from "./pages/CompareArtists";
import Referrals from "./pages/Referrals";
import Wallet from "./pages/Wallet";

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
          <Route path="/artist-signup/:token" element={<ArtistSignup />} />

          {/* Customer-only Routes */}
          <Route
            path="/home"
            element={
              <RoleGate allow={["customer"]} showLoading>
                <Home />
              </RoleGate>
            }
          />
          <Route
            path="/makeup-artists"
            element={
              <RoleGate allow={["customer"]} showLoading>
                <MakeupArtists />
              </RoleGate>
            }
          />
          <Route
            path="/artist/:id"
            element={
              <RoleGate allow={["customer"]} showLoading>
                <ArtistProfile />
              </RoleGate>
            }
          />
          <Route
            path="/booking/:id"
            element={
              <RoleGate allow={["customer"]} showLoading>
                <Booking />
              </RoleGate>
            }
          />
          <Route
            path="/bookings"
            element={
              <RoleGate allow={["customer"]} showLoading>
                <Bookings />
              </RoleGate>
            }
          />
          <Route
            path="/bookings/:id"
            element={
              <RoleGate allow={["customer"]} showLoading>
                <BookingDetails />
              </RoleGate>
            }
          />
          <Route
            path="/favorites"
            element={
              <RoleGate allow={["customer"]} showLoading>
                <Favorites />
              </RoleGate>
            }
          />
          <Route
            path="/compare"
            element={
              <RoleGate allow={["customer"]} showLoading>
                <CompareArtists />
              </RoleGate>
            }
          />
          <Route path="/referrals" element={<Referrals />} />
          
          {/* Payment Result - Public route for callbacks */}
          <Route path="/payment-result" element={<PaymentResult />} />

          {/* Artist-only Routes */}
          <Route
            path="/artist-dashboard"
            element={
              <RoleGate allow={["artist"]} showLoading>
                <ArtistEarnings />
              </RoleGate>
            }
          />
          <Route
            path="/artist-bookings"
            element={
              <RoleGate allow={["artist"]} showLoading>
                <ArtistBookings />
              </RoleGate>
            }
          />
          <Route
            path="/artist-services"
            element={
              <RoleGate allow={["artist"]} showLoading>
                <ArtistServices />
              </RoleGate>
            }
          />
          <Route
            path="/artist-profile"
            element={
              <RoleGate allow={["artist"]} showLoading>
                <ArtistProfilePage />
              </RoleGate>
            }
          />
          <Route
            path="/artist-gallery"
            element={
              <RoleGate allow={["artist"]} showLoading>
                <ArtistGallery />
              </RoleGate>
            }
          />
          <Route
            path="/artist-notifications"
            element={
              <RoleGate allow={["artist"]} showLoading>
                <ArtistNotifications />
              </RoleGate>
            }
          />

          {/* Shared Routes (Customer + Artist) */}
          <Route path="/messages" element={<Messages />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/help" element={<HelpSupport />} />
          <Route path="/payment-methods" element={<PaymentMethods />} />
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
          <Route path="/admin/banners" element={<AdminBanners />} />
          <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
