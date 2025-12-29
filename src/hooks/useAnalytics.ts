import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initGA, trackPageView, setUserId, analytics } from "@/lib/analytics";
import { useAuth } from "./useAuth";

/**
 * Hook for analytics integration
 * Automatically tracks page views and sets user context
 */
export const useAnalytics = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Initialize GA on mount
  useEffect(() => {
    initGA();
  }, []);

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  // Set user ID when user changes
  useEffect(() => {
    setUserId(user?.id || null);
  }, [user?.id]);

  return analytics;
};

/**
 * Analytics Provider Component
 * Wrap your app with this to enable analytics
 */
export const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
  useAnalytics();
  return <>{children}</>;
};

