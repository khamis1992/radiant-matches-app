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
 * Hook for loyalty points system
 * Note: This feature requires loyalty_points and loyalty_transactions tables
 */
export const useLoyaltyPoints = () => {
  const loyaltyPoints: LoyaltyPoints | null = null;
  const transactions: LoyaltyTransaction[] = [];
  const isLoading = false;
  const error = null;

  const redeemPoints = {
    mutate: (_points: number) => {
      console.log("Loyalty points not configured - tables not available");
    },
    isPending: false,
  };

  const calculatePointsForBooking = (_amount: number) => {
    return 0;
  };

  const calculateRedemptionValue = (_points: number) => {
    return 0;
  };

  return {
    loyaltyPoints,
    transactions,
    isLoading,
    error,
    redeemPoints,
    calculatePointsForBooking,
    calculateRedemptionValue,
    tierBenefits: loyaltyPoints ? TIER_BENEFITS[loyaltyPoints.tier] : TIER_BENEFITS.bronze,
  };
};
