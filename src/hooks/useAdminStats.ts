import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdminStats {
  totalUsers: number;
  totalArtists: number;
  totalBookings: number;
  totalRevenue: number;
  platformEarnings: number;
  pendingBookings: number;
  completedBookings: number;
  thisMonthBookings: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
}

export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async (): Promise<AdminStats> => {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      // Fetch all stats in parallel
      const [
        usersResult,
        artistsResult,
        bookingsResult,
        thisMonthBookingsResult,
        lastMonthBookingsResult,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("artists").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("*"),
        supabase
          .from("bookings")
          .select("total_price, platform_fee, status")
          .gte("created_at", thisMonthStart),
        supabase
          .from("bookings")
          .select("total_price, platform_fee")
          .gte("created_at", lastMonthStart)
          .lte("created_at", lastMonthEnd)
          .eq("status", "completed"),
      ]);

      const bookings = bookingsResult.data || [];
      const thisMonthBookings = thisMonthBookingsResult.data || [];
      const lastMonthBookings = lastMonthBookingsResult.data || [];

      const totalRevenue = bookings
        .filter((b) => b.status === "completed")
        .reduce((sum, b) => sum + Number(b.total_price || 0), 0);

      const platformEarnings = bookings
        .filter((b) => b.status === "completed")
        .reduce((sum, b) => sum + Number(b.platform_fee || 0), 0);

      const thisMonthRevenue = thisMonthBookings
        .filter((b) => b.status === "completed")
        .reduce((sum, b) => sum + Number(b.total_price || 0), 0);

      const lastMonthRevenue = lastMonthBookings.reduce(
        (sum, b) => sum + Number(b.total_price || 0),
        0
      );

      return {
        totalUsers: usersResult.count || 0,
        totalArtists: artistsResult.count || 0,
        totalBookings: bookings.length,
        totalRevenue,
        platformEarnings,
        pendingBookings: bookings.filter((b) => b.status === "pending").length,
        completedBookings: bookings.filter((b) => b.status === "completed").length,
        thisMonthBookings: thisMonthBookings.length,
        thisMonthRevenue,
        lastMonthRevenue,
      };
    },
  });
};

interface RecentBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  total_price: number;
  status: string;
  customer: { full_name: string | null } | null;
  artist: { full_name: string | null } | null;
}

export const useRecentBookings = (limit = 5) => {
  return useQuery({
    queryKey: ["admin-recent-bookings", limit],
    queryFn: async (): Promise<RecentBooking[]> => {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("id, booking_date, booking_time, total_price, status, customer_id, artist_id")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Fetch customer and artist names
      const enrichedBookings = await Promise.all(
        (bookings || []).map(async (booking) => {
          const [customerResult, artistResult] = await Promise.all([
            supabase
              .from("profiles")
              .select("full_name")
              .eq("id", booking.customer_id)
              .maybeSingle(),
            supabase
              .from("artists")
              .select("user_id")
              .eq("id", booking.artist_id)
              .maybeSingle()
              .then(async (res) => {
                if (res.data?.user_id) {
                  return supabase
                    .from("profiles")
                    .select("full_name")
                    .eq("id", res.data.user_id)
                    .maybeSingle();
                }
                return { data: null };
              }),
          ]);

          return {
            ...booking,
            customer: customerResult.data,
            artist: artistResult.data,
          };
        })
      );

      return enrichedBookings;
    },
  });
};

interface MonthlyRevenue {
  month: string;
  revenue: number;
  bookings: number;
}

export const useMonthlyRevenue = () => {
  return useQuery({
    queryKey: ["admin-monthly-revenue"],
    queryFn: async (): Promise<MonthlyRevenue[]> => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);

      const { data, error } = await supabase
        .from("bookings")
        .select("created_at, total_price, status")
        .gte("created_at", sixMonthsAgo.toISOString())
        .eq("status", "completed");

      if (error) throw error;

      const monthlyData: Record<string, { revenue: number; bookings: number }> = {};
      const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        monthlyData[key] = { revenue: 0, bookings: 0 };
      }

      // Aggregate data
      (data || []).forEach((booking) => {
        const date = new Date(booking.created_at);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (monthlyData[key]) {
          monthlyData[key].revenue += Number(booking.total_price || 0);
          monthlyData[key].bookings += 1;
        }
      });

      return Object.entries(monthlyData).map(([key, value]) => {
        const [year, month] = key.split("-").map(Number);
        return {
          month: months[month],
          ...value,
        };
      });
    },
  });
};
