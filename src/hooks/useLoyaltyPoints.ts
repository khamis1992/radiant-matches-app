import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface LoyaltyPoints {
  id: string;
  user_id: string;
  points: number;
  lifetime_points: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  points: number;
  type: "earn" | "redeem" | "bonus" | "expire" | "referral";
  description: string | null;
  booking_id: string | null;
  created_at: string;
}

// Tier benefits
export const TIER_BENEFITS = {
  bronze: {
    name: "Bronze",
    pointsMultiplier: 1,
    discountPercent: 0,
    minPoints: 0,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  silver: {
    name: "Silver",
    pointsMultiplier: 1.25,
    discountPercent: 5,
    minPoints: 1000,
    color: "text-gray-500",
    bgColor: "bg-gray-100",
  },
  gold: {
    name: "Gold",
    pointsMultiplier: 1.5,
    discountPercent: 10,
    minPoints: 5000,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100",
  },
  platinum: {
    name: "Platinum",
    pointsMultiplier: 2,
    discountPercent: 15,
    minPoints: 10000,
    color: "text-purple-500",
    bgColor: "bg-purple-100",
  },
};

/**
 * Hook for managing user loyalty points
 * Provides points balance, transactions, and redemption
 */
export const useLoyaltyPoints = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's loyalty points
  const { data: loyaltyData, isLoading: isLoadingPoints } = useQuery({
    queryKey: ["loyalty-points", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("loyalty_points")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as LoyaltyPoints | null;
    },
    enabled: !!user?.id,
  });

  // Fetch loyalty transactions
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["loyalty-transactions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("loyalty_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as LoyaltyTransaction[];
    },
    enabled: !!user?.id,
  });

  // Redeem points for wallet credit
  const redeemPoints = useMutation({
    mutationFn: async (pointsToRedeem: number) => {
      if (!user?.id) throw new Error("Not authenticated");
      if (!loyaltyData || loyaltyData.points < pointsToRedeem) {
        throw new Error("Insufficient points");
      }

      // 100 points = 1 QAR
      const creditAmount = pointsToRedeem / 100;

      // Deduct points
      const { error: pointsError } = await supabase
        .from("loyalty_points")
        .update({
          points: loyaltyData.points - pointsToRedeem,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (pointsError) throw pointsError;

      // Record transaction
      const { error: txError } = await supabase
        .from("loyalty_transactions")
        .insert({
          user_id: user.id,
          points: -pointsToRedeem,
          type: "redeem",
          description: `Redeemed ${pointsToRedeem} points for ${creditAmount} QAR wallet credit`,
        });

      if (txError) throw txError;

      // Add to wallet
      const { error: walletError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: user.id,
          amount: creditAmount,
          type: "points_redemption",
          status: "completed",
          description: `Loyalty points redemption (${pointsToRedeem} points)`,
        });

      if (walletError) throw walletError;

      // Update wallet balance
      await supabase.rpc("update_wallet_balance", {
        p_user_id: user.id,
        p_amount: creditAmount,
      });

      return { pointsRedeemed: pointsToRedeem, creditAmount };
    },
    onSuccess: ({ pointsRedeemed, creditAmount }) => {
      toast.success(`Redeemed ${pointsRedeemed} points for ${creditAmount} QAR!`);
      queryClient.invalidateQueries({ queryKey: ["loyalty-points"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to redeem points");
    },
  });

  // Calculate progress to next tier
  const getNextTierProgress = () => {
    if (!loyaltyData) return { nextTier: "silver", progress: 0, pointsNeeded: 1000 };

    const currentTier = loyaltyData.tier;
    const lifetime = loyaltyData.lifetime_points;

    if (currentTier === "platinum") {
      return { nextTier: null, progress: 100, pointsNeeded: 0 };
    }

    const tiers = ["bronze", "silver", "gold", "platinum"] as const;
    const currentIndex = tiers.indexOf(currentTier);
    const nextTier = tiers[currentIndex + 1];
    const nextTierPoints = TIER_BENEFITS[nextTier].minPoints;
    const currentTierPoints = TIER_BENEFITS[currentTier].minPoints;

    const progress = Math.min(
      100,
      ((lifetime - currentTierPoints) / (nextTierPoints - currentTierPoints)) * 100
    );
    const pointsNeeded = nextTierPoints - lifetime;

    return { nextTier, progress, pointsNeeded };
  };

  return {
    points: loyaltyData?.points || 0,
    lifetimePoints: loyaltyData?.lifetime_points || 0,
    tier: loyaltyData?.tier || "bronze",
    tierBenefits: TIER_BENEFITS[loyaltyData?.tier || "bronze"],
    transactions,
    isLoading: isLoadingPoints || isLoadingTransactions,
    redeemPoints: redeemPoints.mutate,
    isRedeeming: redeemPoints.isPending,
    getNextTierProgress,
  };
};

