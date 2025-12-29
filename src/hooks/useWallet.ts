import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

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
      
      // If no wallet exists, create one
      if (!data) {
        const { data: newWallet, error: insertError } = await supabase
          .from("wallet_balances")
          .insert({ user_id: user.id, balance: 0, currency: "QAR" })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newWallet as WalletBalance;
      }
      
      return data as WalletBalance;
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

  // Top up wallet
  const topUpMutation = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description?: string }) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      // Create transaction record
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: user.id,
          type: "topup",
          amount,
          description: description || "Wallet top-up",
          status: "completed",
        });

      if (txError) throw txError;

      // Update balance
      const currentBalance = walletData?.balance || 0;
      const { error: balanceError } = await supabase
        .from("wallet_balances")
        .update({ balance: currentBalance + amount })
        .eq("user_id", user.id);

      if (balanceError) throw balanceError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
      toast.success("Wallet topped up successfully");
    },
    onError: (error) => {
      toast.error("Failed to top up wallet");
      console.error("Top up error:", error);
    },
  });

  // Withdraw from wallet
  const withdrawMutation = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description?: string }) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const currentBalance = walletData?.balance || 0;
      if (amount > currentBalance) {
        throw new Error("Insufficient balance");
      }

      // Create transaction record
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: user.id,
          type: "withdrawal",
          amount: -amount,
          description: description || "Wallet withdrawal",
          status: "completed",
        });

      if (txError) throw txError;

      // Update balance
      const { error: balanceError } = await supabase
        .from("wallet_balances")
        .update({ balance: currentBalance - amount })
        .eq("user_id", user.id);

      if (balanceError) throw balanceError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
      toast.success("Withdrawal successful");
    },
    onError: (error) => {
      if (error.message === "Insufficient balance") {
        toast.error("Insufficient balance");
      } else {
        toast.error("Failed to withdraw");
      }
      console.error("Withdraw error:", error);
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