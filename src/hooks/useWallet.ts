import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface WalletBalance {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  status: string;
  created_at: string;
}

export const useWallet = () => {
  const { user } = useAuth();

  // Fetch wallet balance
  const { data: walletData, isLoading: balanceLoading } = useQuery({
    queryKey: ["wallet-balance", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("wallet_balances")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as WalletBalance | null;
    },
    enabled: !!user?.id,
  });

  // Fetch wallet transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["wallet-transactions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled: !!user?.id,
  });

  // Financial operations must be initiated through a verified payment or payout provider.
  // The browser must never be able to credit or debit a wallet directly.
  const topUpMutation = useMutation({
    mutationFn: async (_: { amount: number; description?: string }) => {
      throw new Error("Wallet top-ups are temporarily unavailable while secure payment processing is being configured.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Wallet top-ups are temporarily unavailable.");
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (_: { amount: number; description?: string }) => {
      throw new Error("Wallet withdrawals are temporarily unavailable while secure payout processing is being configured.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Wallet withdrawals are temporarily unavailable.");
    },
  });

  return {
    balance: walletData?.balance || 0,
    currency: walletData?.currency || "QAR",
    balanceLoading,
    transactions,
    transactionsLoading,
    topUp: topUpMutation.mutate,
    isTopUpping: topUpMutation.isPending,
    withdraw: withdrawMutation.mutate,
    isWithdrawing: withdrawMutation.isPending,
  };
};
