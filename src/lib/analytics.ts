/**
 * Google Analytics Integration
 * Tracks user events and page views
 */

// Google Analytics Measurement ID - Replace with your actual ID
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "";

// Initialize Google Analytics
export const initGA = () => {
  if (!GA_MEASUREMENT_ID) {
    // Silently skip analytics initialization if not configured
    return;
  }

  // Add gtag script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: false, // We'll track manually for SPA
  });

  console.log("[Analytics] Google Analytics initialized");
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  if (!window.gtag) return;

  window.gtag("event", "page_view", {
    page_path: path,
    page_title: title || document.title,
  });
};

// Track custom events
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  if (!window.gtag) return;

  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Track user properties
export const setUserProperties = (properties: Record<string, any>) => {
  if (!window.gtag) return;

  window.gtag("set", "user_properties", properties);
};

// Track user ID
export const setUserId = (userId: string | null) => {
  if (!window.gtag) return;

  if (userId) {
    window.gtag("config", GA_MEASUREMENT_ID, {
      user_id: userId,
    });
  }
};

// Predefined event tracking functions
export const analytics = {
  // Auth events
  trackLogin: (method: string) => trackEvent("auth", "login", method),
  trackSignup: (method: string) => trackEvent("auth", "signup", method),
  trackLogout: () => trackEvent("auth", "logout"),

  // Booking events
  trackBookingStarted: (artistId: string, serviceId: string) =>
    trackEvent("booking", "started", `${artistId}/${serviceId}`),
  trackBookingCompleted: (bookingId: string, amount: number) =>
    trackEvent("booking", "completed", bookingId, amount),
  trackBookingCancelled: (bookingId: string) =>
    trackEvent("booking", "cancelled", bookingId),

  // Artist events
  trackArtistViewed: (artistId: string) =>
    trackEvent("artist", "viewed", artistId),
  trackArtistFavorited: (artistId: string) =>
    trackEvent("artist", "favorited", artistId),
  trackArtistContacted: (artistId: string) =>
    trackEvent("artist", "contacted", artistId),

  // Search events
  trackSearch: (query: string, resultsCount: number) =>
    trackEvent("search", "performed", query, resultsCount),
  trackFilterApplied: (filterType: string, filterValue: string) =>
    trackEvent("filter", "applied", `${filterType}:${filterValue}`),

  // Engagement events
  trackReviewSubmitted: (artistId: string, rating: number) =>
    trackEvent("review", "submitted", artistId, rating),
  trackShareClicked: (contentType: string, contentId: string) =>
    trackEvent("share", "clicked", `${contentType}/${contentId}`),

  // E-commerce events
  trackWalletTopUp: (amount: number) =>
    trackEvent("wallet", "top_up", undefined, amount),
  trackPointsRedeemed: (points: number) =>
    trackEvent("loyalty", "points_redeemed", undefined, points),

  // PWA events
  trackInstallPromptShown: () => trackEvent("pwa", "install_prompt_shown"),
  trackAppInstalled: () => trackEvent("pwa", "installed"),
};

// Type declarations
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

