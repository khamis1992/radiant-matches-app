import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface AdminNotification {
  id: string;
  type: "new_booking" | "pending_booking" | "cancelled_booking";
  message: string;
  bookingId: string;
  createdAt: Date;
  isRead: boolean;
}

export const useAdminNotifications = () => {
  const { role } = useUserRole();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((notification: Omit<AdminNotification, "id" | "createdAt" | "isRead">) => {
    const newNotification: AdminNotification = {
      ...notification,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      isRead: false,
    };

    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    setUnreadCount((prev) => prev + 1);

    // Show toast notification
    const toastType = notification.type === "cancelled_booking" ? "warning" : "info";
    if (toastType === "warning") {
      toast.warning(notification.message, {
        duration: 5000,
        action: {
          label: "عرض",
          onClick: () => {
            window.location.href = "/admin/bookings";
          },
        },
      });
    } else {
      toast.info(notification.message, {
        duration: 5000,
        action: {
          label: "عرض",
          onClick: () => {
            window.location.href = "/admin/bookings";
          },
        },
      });
    }
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (role !== "admin") return;

    console.log("Setting up admin notifications listener...");

    // Subscribe to bookings table changes
    const channel = supabase
      .channel("admin-bookings-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookings",
        },
        async (payload) => {
          console.log("New booking received:", payload);

          // Fetch customer name
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", payload.new.customer_id)
            .maybeSingle();

          const customerName = profile?.full_name || "عميل جديد";

          addNotification({
            type: "new_booking",
            message: `حجز جديد من ${customerName}`,
            bookingId: payload.new.id,
          });

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
          queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
        },
        async (payload) => {
          console.log("Booking updated:", payload);

          const oldStatus = payload.old?.status;
          const newStatus = payload.new.status;

          // Only notify on status changes
          if (oldStatus !== newStatus) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", payload.new.customer_id)
              .maybeSingle();

            const customerName = profile?.full_name || "عميل";

            if (newStatus === "cancelled") {
              addNotification({
                type: "cancelled_booking",
                message: `تم إلغاء حجز ${customerName}`,
                bookingId: payload.new.id,
              });
            } else if (newStatus === "pending" && oldStatus !== "pending") {
              addNotification({
                type: "pending_booking",
                message: `حجز معلق من ${customerName}`,
                bookingId: payload.new.id,
              });
            }

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
            queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
          }
        }
      )
      .subscribe((status) => {
        console.log("Admin notifications subscription status:", status);
      });

    return () => {
      console.log("Cleaning up admin notifications listener...");
      supabase.removeChannel(channel);
    };
  }, [role, addNotification, queryClient]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
};
