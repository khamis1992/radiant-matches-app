/**
 * Main Application Component
 * All routes are wrapped with LanguageProvider for i18n support
 */
import React, { useEffect, useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { RoleGate } from "@/components/auth/RoleGate";
import { LanguageProvider } from "@/contexts/LanguageContext";
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
import ArtistProducts from "./pages/artist/ArtistProducts";
import ArtistProductForm from "./pages/artist/ArtistProductForm";
import ArtistAnalytics from "./pages/artist/ArtistAnalytics";
import Booking from "./pages/Booking";
import Bookings from "./pages/Bookings";
import BookingDetails from "./pages/BookingDetails";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Favorites from "./pages/Favorites";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import OrderConfirmation from "./pages/OrderConfirmation";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import HelpSupport from "./pages/HelpSupport";
import PaymentMethods from "./pages/PaymentMethods";
import PaymentResult from "./pages/PaymentResult";
import ProductPaymentResult from "./pages/ProductPaymentResult";
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
import AdminCampaigns from "./pages/admin/AdminCampaigns";
import ArtistSignup from "./pages/ArtistSignup";
import CompareArtists from "./pages/CompareArtists";
import Referrals from "./pages/Referrals";
import Wallet from "./pages/Wallet";
import Logout from "./pages/Logout";
import { InstallAppPrompt } from "./components/InstallAppPrompt";
import { PermissionsPrompt } from "./components/PermissionsPrompt";
import { AnalyticsProvider } from "./hooks/useAnalytics";


const queryClient = new QueryClient();

// App component with all providers
const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <NotificationPrompt />
        <InstallAppPrompt />
        <PermissionsPrompt />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/artist-signup" element={<ArtistSignup />} />
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
              <RoleGate allow={["customer", "artist"]} showLoading>
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
          <Route path="/product-payment-result" element={<ProductPaymentResult />} />

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
          <Route
            path="/artist-products"
            element={
              <RoleGate allow={["artist"]} showLoading>
                <ArtistProducts />
              </RoleGate>
            }
          />
          <Route
            path="/artist-products/new"
            element={
              <RoleGate allow={["artist"]} showLoading>
                <ArtistProductForm />
              </RoleGate>
            }
          />
          <Route
            path="/artist-analytics"
            element={
              <RoleGate allow={["artist"]} showLoading>
                <ArtistAnalytics />
              </RoleGate>
            }
          />
          <Route
            path="/artist-products/:id/edit"
            element={
              <RoleGate allow={["artist"]} showLoading>
                <ArtistProductForm />
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
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/help" element={<HelpSupport />} />
          <Route path="/payment-methods" element={<PaymentMethods />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/logout" element={<Logout />} />
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
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/campaigns" element={<AdminCampaigns />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AnalyticsTracker />
      </BrowserRouter>
    </TooltipProvider>
  </LanguageProvider>
</QueryClientProvider>
);

const AnalyticsTracker = () => {
  const location = useMemo(() => window.location, []);
  
  useEffect(() => {
    // Initialize analytics
    import("./lib/analytics").then(({ initGA, trackPageView }) => {
      initGA();
      trackPageView(window.location.pathname);
    });
  }, []);
  
  return null;
};

export default App;
