/**
 * Main Application Component
 * - Route-level code splitting: every page is lazy-loaded (except Onboarding/Auth)
 * - RoleGate with requireAuth for account-only routes
 * - Global ErrorBoundary, Android back-button handling, per-route analytics
 */
import React, { Suspense, lazy, useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { RoleGate } from "@/components/auth/RoleGate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useAndroidBackButton } from "@/hooks/useAndroidBackButton";
import { InstallAppPrompt } from "./components/InstallAppPrompt";
import { PermissionsPrompt } from "./components/PermissionsPrompt";
import { AnalyticsProvider } from "./hooks/useAnalytics";

// Eager: first-paint flow only
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";

// Lazy: everything else (one chunk per page, loaded on demand)
const Home = lazy(() => import("./pages/Home"));
const MakeupArtists = lazy(() => import("./pages/MakeupArtists"));
const ArtistProfile = lazy(() => import("./pages/ArtistProfile"));
const ArtistEarnings = lazy(() => import("./pages/artist/ArtistEarnings"));
const ArtistBookings = lazy(() => import("./pages/artist/ArtistBookings"));
const ArtistServices = lazy(() => import("./pages/artist/ArtistServices"));
const ArtistProfilePage = lazy(() => import("./pages/artist/ArtistProfilePage"));
const ArtistGallery = lazy(() => import("./pages/artist/ArtistGallery"));
const ArtistNotifications = lazy(() => import("./pages/artist/ArtistNotifications"));
const ArtistProducts = lazy(() => import("./pages/artist/ArtistProducts"));
const ArtistProductForm = lazy(() => import("./pages/artist/ArtistProductForm"));
const ArtistAnalytics = lazy(() => import("./pages/artist/ArtistAnalytics"));
const Booking = lazy(() => import("./pages/Booking"));
const Bookings = lazy(() => import("./pages/Bookings"));
const BookingDetails = lazy(() => import("./pages/BookingDetails"));
const Messages = lazy(() => import("./pages/Messages"));
const Chat = lazy(() => import("./pages/Chat"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetails = lazy(() => import("./pages/OrderDetails"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const Settings = lazy(() => import("./pages/Settings"));
const Notifications = lazy(() => import("./pages/Notifications"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));
const PaymentMethods = lazy(() => import("./pages/PaymentMethods"));
const PaymentResult = lazy(() => import("./pages/PaymentResult"));
const ProductPaymentResult = lazy(() => import("./pages/ProductPaymentResult"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminArtists = lazy(() => import("./pages/admin/AdminArtists"));
const AdminPromoCodes = lazy(() => import("./pages/admin/AdminPromoCodes"));
const AdminFinance = lazy(() => import("./pages/admin/AdminFinance"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminServices = lazy(() => import("./pages/admin/AdminServices"));
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners"));
const AdminWithdrawals = lazy(() => import("./pages/admin/AdminWithdrawals"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminCampaigns = lazy(() => import("./pages/admin/AdminCampaigns"));
const AdminBlockedIPs = lazy(() => import("./pages/admin/AdminBlockedIPs"));
const AdminActivityLog = lazy(() => import("./pages/admin/AdminActivityLog"));
const AdminSecurityAudit = lazy(() => import("./pages/admin/AdminSecurityAudit"));
const AdminImageModeration = lazy(() => import("./pages/admin/AdminImageModeration"));
const ArtistSignup = lazy(() => import("./pages/ArtistSignup"));
const CompareArtists = lazy(() => import("./pages/CompareArtists"));
const Referrals = lazy(() => import("./pages/Referrals"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Logout = lazy(() => import("./pages/Logout"));
const EmailPreview = lazy(() => import("./pages/EmailPreview"));
const SellerDashboard = lazy(() => import("./pages/seller/SellerDashboard"));
const SellerProducts = lazy(() => import("./pages/seller/SellerProducts"));
const SellerOrders = lazy(() => import("./pages/seller/SellerOrders"));
const SellerSignup = lazy(() => import("./pages/seller/SellerSignup"));
const Shops = lazy(() => import("./pages/Shops"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Mobile-friendly defaults: avoid aggressive refetch storms on WebViews
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Branded full-screen fallback while a lazy page chunk loads */
const PageFallback = () => (
  <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4">
    <img
      src="/brand/glam-logo-light.png"
      alt="GLAM"
      className="h-10 w-auto animate-pulse"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
    <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
      <div className="h-full w-1/2 animate-[loading_1s_ease-in-out_infinite] rounded-full bg-primary" />
    </div>
  </div>
);

/** Admin routes share one gate: must be logged in AND have the admin role */
const AdminGate = ({ children }: { children: React.ReactNode }) => (
  <RoleGate allow={["admin"]} requireAuth showLoading>
    {children}
  </RoleGate>
);

/** Tracks a pageview on every route change */
const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    import("./lib/analytics").then(({ initGA, trackPageView }) => {
      initGA();
      trackPageView(location.pathname + location.search);
    });
  }, [location.pathname, location.search]);

  return null;
};

/** Registers the Android hardware back-button handler inside the router */
const BackButtonHandler = () => {
  useAndroidBackButton();
  return null;
};

// App component with all providers
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
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
            <BackButtonHandler />
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Onboarding />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/artist-signup" element={<ArtistSignup />} />
                <Route path="/artist-signup/:token" element={<ArtistSignup />} />
                <Route path="/seller-signup" element={<SellerSignup />} />

                {/* Customer Routes — browsable by guests */}
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
                  path="/shops"
                  element={
                    <RoleGate allow={["customer"]} showLoading>
                      <Shops />
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
                  path="/compare"
                  element={
                    <RoleGate allow={["customer"]} showLoading>
                      <CompareArtists />
                    </RoleGate>
                  }
                />

                {/* Customer Routes — account required */}
                <Route
                  path="/booking/:id"
                  element={
                    <RoleGate allow={["customer"]} requireAuth showLoading>
                      <Booking />
                    </RoleGate>
                  }
                />
                <Route
                  path="/bookings"
                  element={
                    <RoleGate allow={["customer"]} requireAuth showLoading>
                      <Bookings />
                    </RoleGate>
                  }
                />
                <Route
                  path="/bookings/:id"
                  element={
                    <RoleGate allow={["customer"]} requireAuth showLoading>
                      <BookingDetails />
                    </RoleGate>
                  }
                />
                <Route
                  path="/favorites"
                  element={
                    <RoleGate allow={["customer"]} requireAuth showLoading>
                      <Favorites />
                    </RoleGate>
                  }
                />
                <Route
                  path="/referrals"
                  element={
                    <RoleGate allow={["customer", "artist", "seller"]} requireAuth showLoading>
                      <Referrals />
                    </RoleGate>
                  }
                />

                {/* Payment Result - Public routes for gateway callbacks */}
                <Route path="/payment-result" element={<PaymentResult />} />
                <Route path="/product-payment-result" element={<ProductPaymentResult />} />

                {/* Artist-only Routes */}
                <Route
                  path="/artist-dashboard"
                  element={
                    <RoleGate allow={["artist"]} requireAuth showLoading>
                      <ArtistEarnings />
                    </RoleGate>
                  }
                />
                <Route
                  path="/artist-bookings"
                  element={
                    <RoleGate allow={["artist"]} requireAuth showLoading>
                      <ArtistBookings />
                    </RoleGate>
                  }
                />
                <Route
                  path="/artist-services"
                  element={
                    <RoleGate allow={["artist"]} requireAuth showLoading>
                      <ArtistServices />
                    </RoleGate>
                  }
                />
                <Route
                  path="/artist-profile"
                  element={
                    <RoleGate allow={["artist"]} requireAuth showLoading>
                      <ArtistProfilePage />
                    </RoleGate>
                  }
                />
                <Route
                  path="/artist-gallery"
                  element={
                    <RoleGate allow={["artist"]} requireAuth showLoading>
                      <ArtistGallery />
                    </RoleGate>
                  }
                />
                <Route
                  path="/artist-notifications"
                  element={
                    <RoleGate allow={["artist"]} requireAuth showLoading>
                      <ArtistNotifications />
                    </RoleGate>
                  }
                />
                <Route
                  path="/artist-products"
                  element={
                    <RoleGate allow={["artist"]} requireAuth showLoading>
                      <ArtistProducts />
                    </RoleGate>
                  }
                />
                <Route
                  path="/artist-products/new"
                  element={
                    <RoleGate allow={["artist"]} requireAuth showLoading>
                      <ArtistProductForm />
                    </RoleGate>
                  }
                />
                <Route
                  path="/artist-analytics"
                  element={
                    <RoleGate allow={["artist"]} requireAuth showLoading>
                      <ArtistAnalytics />
                    </RoleGate>
                  }
                />
                <Route
                  path="/artist-products/:id/edit"
                  element={
                    <RoleGate allow={["artist"]} requireAuth showLoading>
                      <ArtistProductForm />
                    </RoleGate>
                  }
                />

                {/* Seller-only Routes */}
                <Route
                  path="/seller-dashboard"
                  element={
                    <RoleGate allow={["seller"]} requireAuth showLoading>
                      <SellerDashboard />
                    </RoleGate>
                  }
                />
                <Route
                  path="/seller-products"
                  element={
                    <RoleGate allow={["seller"]} requireAuth showLoading>
                      <SellerProducts />
                    </RoleGate>
                  }
                />
                <Route
                  path="/seller-orders"
                  element={
                    <RoleGate allow={["seller"]} requireAuth showLoading>
                      <SellerOrders />
                    </RoleGate>
                  }
                />

                {/* Shared Routes — account required */}
                <Route path="/messages" element={<RoleGate allow={["customer", "artist", "seller"]} requireAuth showLoading><Messages /></RoleGate>} />
                <Route path="/chat/:id" element={<RoleGate allow={["customer", "artist", "seller"]} requireAuth showLoading><Chat /></RoleGate>} />
                <Route path="/profile" element={<RoleGate allow={["customer", "artist", "seller"]} requireAuth showLoading><Profile /></RoleGate>} />
                <Route path="/edit-profile" element={<RoleGate allow={["customer", "artist", "seller"]} requireAuth showLoading><EditProfile /></RoleGate>} />
                <Route path="/settings" element={<RoleGate allow={["customer", "artist", "seller"]} requireAuth showLoading><Settings /></RoleGate>} />
                <Route path="/notifications" element={<RoleGate allow={["customer", "artist", "seller"]} requireAuth showLoading><Notifications /></RoleGate>} />
                <Route path="/cart" element={<RoleGate allow={["customer", "artist", "seller"]} showLoading><Cart /></RoleGate>} />
                <Route path="/checkout" element={<RoleGate allow={["customer", "artist", "seller"]} requireAuth showLoading><Checkout /></RoleGate>} />
                <Route path="/order-confirmation" element={<RoleGate allow={["customer", "artist", "seller"]} requireAuth showLoading><OrderConfirmation /></RoleGate>} />
                <Route path="/orders/:id" element={<RoleGate allow={["customer", "artist", "seller"]} requireAuth showLoading><OrderDetails /></RoleGate>} />
                <Route path="/orders" element={<RoleGate allow={["customer", "artist", "seller"]} requireAuth showLoading><Orders /></RoleGate>} />
                <Route path="/help" element={<HelpSupport />} />
                <Route path="/payment-methods" element={<RoleGate allow={["customer", "artist", "seller"]} requireAuth showLoading><PaymentMethods /></RoleGate>} />
                <Route path="/wallet" element={<RoleGate allow={["customer", "artist", "seller"]} requireAuth showLoading><Wallet /></RoleGate>} />
                <Route path="/logout" element={<Logout />} />

                {/* Admin Routes — router-level gate (login + admin role) */}
                <Route path="/admin" element={<AdminGate><AdminDashboard /></AdminGate>} />
                <Route path="/admin/users" element={<AdminGate><AdminUsers /></AdminGate>} />
                <Route path="/admin/artists" element={<AdminGate><AdminArtists /></AdminGate>} />
                <Route path="/admin/promo-codes" element={<AdminGate><AdminPromoCodes /></AdminGate>} />
                <Route path="/admin/finance" element={<AdminGate><AdminFinance /></AdminGate>} />
                <Route path="/admin/bookings" element={<AdminGate><AdminBookings /></AdminGate>} />
                <Route path="/admin/settings" element={<AdminGate><AdminSettings /></AdminGate>} />
                <Route path="/admin/notifications" element={<AdminGate><AdminNotifications /></AdminGate>} />
                <Route path="/admin/reviews" element={<AdminGate><AdminReviews /></AdminGate>} />
                <Route path="/admin/services" element={<AdminGate><AdminServices /></AdminGate>} />
                <Route path="/admin/banners" element={<AdminGate><AdminBanners /></AdminGate>} />
                <Route path="/admin/withdrawals" element={<AdminGate><AdminWithdrawals /></AdminGate>} />
                <Route path="/admin/reports" element={<AdminGate><AdminReports /></AdminGate>} />
                <Route path="/admin/campaigns" element={<AdminGate><AdminCampaigns /></AdminGate>} />
                <Route path="/admin/blocked-ips" element={<AdminGate><AdminBlockedIPs /></AdminGate>} />
                <Route path="/admin/activity-log" element={<AdminGate><AdminActivityLog /></AdminGate>} />
                <Route path="/admin/security-audit" element={<AdminGate><AdminSecurityAudit /></AdminGate>} />
                <Route path="/admin/image-moderation" element={<AdminGate><AdminImageModeration /></AdminGate>} />
                <Route path="/email-preview" element={<EmailPreview />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <AnalyticsTracker />
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
