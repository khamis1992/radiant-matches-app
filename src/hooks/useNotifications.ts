import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";

export const useNotifications = () => {
  const { user } = useAuth();
  const { isArtist } = useUserRole();
  const [permission, setPermission] = useState<NotificationPermission>("default");

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === "granted") {
      new Notification(title, {
        icon: "/favicon.png",
        badge: "/favicon.png",
        ...options,
      });
    }
  }, [permission]);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Listen for new bookings (for artists)
  useEffect(() => {
    if (!user || !isArtist || permission !== "granted") return;

    const getArtistId = async () => {
      const { data } = await supabase
        .from("artists")
        .select("id")
        .eq("user_id", user.id)
        .single();
      return data?.id;
    };

    let channel: ReturnType<typeof supabase.channel> | null = null;

    getArtistId().then((artistId) => {
      if (!artistId) return;

      channel = supabase
        .channel("booking-notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "bookings",
            filter: `artist_id=eq.${artistId}`,
          },
          (payload) => {
            console.log("New booking received:", payload);
            showNotification("New Booking Request! 🎉", {
              body: `You have a new booking for ${payload.new.booking_date}`,
              tag: `booking-${payload.new.id}`,
            });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "bookings",
            filter: `artist_id=eq.${artistId}`,
          },
          (payload) => {
            if (payload.old.status !== payload.new.status) {
              showNotification("Booking Updated", {
                body: `A booking status changed to ${payload.new.status}`,
                tag: `booking-update-${payload.new.id}`,
              });
            }
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, isArtist, permission, showNotification]);

  // Listen for booking updates (for customers)
  useEffect(() => {
    if (!user || isArtist || permission !== "granted") return;

    const channel = supabase
      .channel("customer-booking-notifications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `customer_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.old.status !== payload.new.status) {
            const statusMessages: Record<string, string> = {
              confirmed: "Your booking has been confirmed! ✅",
              cancelled: "Your booking has been cancelled",
              completed: "Your booking has been completed! 🎉",
            };
            const message = statusMessages[payload.new.status] || `Booking status: ${payload.new.status}`;
            showNotification("Booking Update", {
              body: message,
              tag: `booking-${payload.new.id}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isArtist, permission, showNotification]);

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: "Notification" in window,
  };
};
