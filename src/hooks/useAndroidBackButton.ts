import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

/**
 * Handles the Android hardware back button.
 * - On "root" tab screens: exit the app (standard Android behavior).
 * - Otherwise: navigate back in history, falling back to /home.
 *
 * Must be rendered inside the router.
 */
const ROOT_PATHS = new Set([
  "/",
  "/home",
  "/makeup-artists",
  "/shops",
  "/favorites",
  "/bookings",
  "/artist-dashboard",
  "/artist-bookings",
  "/artist-services",
  "/artist-gallery",
  "/artist-notifications",
  "/seller-dashboard",
  "/seller-products",
  "/seller-orders",
  "/admin",
  "/auth",
]);

export const useAndroidBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (ROOT_PATHS.has(location.pathname)) {
        CapacitorApp.exitApp();
        return;
      }
      if (canGoBack) {
        navigate(-1);
      } else {
        navigate("/home", { replace: true });
      }
    });

    return () => {
      listenerPromise.then((listener) => listener.remove()).catch(() => {});
    };
  }, [location.pathname, navigate]);
};
