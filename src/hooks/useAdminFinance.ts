import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Transaction {
  id: string;
  booking_id: string | null;
  artist_id: string;
  type: string;
  amount: number;
  platform_fee: number;
  net_amount: number;
  status: string;
  description: string | null;
  created_at: string;
  artist?: {
    id: string;
    user_id: string;
    profiles?: {
      full_name: string | null;
      email: string | null;
    };
  };
}

export interface FinanceStats {
  totalRevenue: number;
  totalPlatformFees: number;
  totalArtistPayouts: number;
  pendingPayouts: number;
  transactionsCount: number;
  monthlyRevenue: { month: string; revenue: number; fees: number }[];
}

export const useAdminFinance = () => {
  return useQuery({
    queryKey: ["admin-finance-stats"],
    queryFn: async () => {
      // Get all transactions
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calculate stats
      const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalPlatformFees = transactions?.reduce((sum, t) => sum + Number(t.platform_fee || 0), 0) || 0;
      const totalArtistPayouts = transactions?.reduce((sum, t) => 
        t.status === 'completed' ? sum + Number(t.net_amount) : sum, 0) || 0;
      const pendingPayouts = transactions?.reduce((sum, t) => 
        t.status === 'pending' ? sum + Number(t.net_amount) : sum, 0) || 0;

      // Calculate monthly revenue (last 6 months)
      const monthlyData: { [key: string]: { revenue: number; fees: number } } = {};
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[key] = { revenue: 0, fees: 0 };
      }

      transactions?.forEach(t => {
        const date = new Date(t.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[key]) {
          monthlyData[key].revenue += Number(t.amount);
          monthlyData[key].fees += Number(t.platform_fee || 0);
        }
      });

      const monthlyRevenue = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        fees: data.fees,
      }));

      return {
        totalRevenue,
        totalPlatformFees,
        totalArtistPayouts,
        pendingPayouts,
        transactionsCount: transactions?.length || 0,
        monthlyRevenue,
      } as FinanceStats;
    },
  });
};

export const useTransactions = (limit?: number) => {
  return useQuery({
    queryKey: ["admin-transactions", limit],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data: transactions, error } = await query;
      if (error) throw error;

      // Fetch artist profiles separately
      const artistIds = [...new Set(transactions?.map(t => t.artist_id) || [])];
      const { data: artists } = await supabase
        .from("artists")
        .select("id, user_id")
        .in("id", artistIds);

      const userIds = artists?.map(a => a.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      // Map transactions with artist info
      const result = transactions?.map(t => {
        const artist = artists?.find(a => a.id === t.artist_id);
        const profile = profiles?.find(p => p.id === artist?.user_id);
        return {
          ...t,
          artist: artist ? {
            id: artist.id,
            user_id: artist.user_id,
            profiles: profile ? {
              full_name: profile.full_name,
              email: profile.email,
            } : undefined,
          } : undefined,
        };
      }) || [];
      
      return result as Transaction[];
    },
  });
};

export const useArtistPayouts = () => {
  return useQuery({
    queryKey: ["admin-artist-payouts"],
    queryFn: async () => {
      // Get all completed transactions
      const { data: allTransactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("status", "completed");

      if (error) throw error;

      // Get unique artist IDs
      const artistIds = [...new Set(allTransactions?.map(t => t.artist_id) || [])];
      
      // Fetch artists and profiles
      const { data: artists } = await supabase
        .from("artists")
        .select("id, user_id")
        .in("id", artistIds);

      const userIds = artists?.map(a => a.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", userIds);

      // Group by artist and calculate totals
      const artistTotals: { [key: string]: { 
        artist_id: string; 
        full_name: string; 
        email: string;
        avatar_url: string | null;
        total_earnings: number; 
        total_fees: number;
        transactions_count: number;
      }} = {};

      allTransactions?.forEach(t => {
        if (!artistTotals[t.artist_id]) {
          const artist = artists?.find(a => a.id === t.artist_id);
          const profile = profiles?.find(p => p.id === artist?.user_id);
          artistTotals[t.artist_id] = {
            artist_id: t.artist_id,
            full_name: profile?.full_name || "غير معروف",
            email: profile?.email || "",
            avatar_url: profile?.avatar_url || null,
            total_earnings: 0,
            total_fees: 0,
            transactions_count: 0,
          };
        }
        artistTotals[t.artist_id].total_earnings += Number(t.net_amount);
        artistTotals[t.artist_id].total_fees += Number(t.platform_fee || 0);
        artistTotals[t.artist_id].transactions_count += 1;
      });

      return Object.values(artistTotals).sort((a, b) => b.total_earnings - a.total_earnings);
    },
  });
};
