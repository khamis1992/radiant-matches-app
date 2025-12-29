import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface WalletBalance {
  id: string;
  user_id: string;
  balance: number | null;
  currency: string;
  created_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: string;
  amount: number | null;
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}

export const useWallet = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("wallet_balances")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { mutate: topUp, isPending: isTopUpping } = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description?: string }) => {
      if (!user) {
        toast.error("Please login first");
        throw new Error("Not logged in");
      }

      // This would be called by admin or through promo codes
      const { data, error } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: user.id,
          type: "credit",
          amount,
          description,
          reference_type: "promo",
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-balance", "wallet-transactions"] });
      toast.success("Wallet topped up successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to top up wallet");
    },
  });

  const { mutate: withdraw, isPending: isWithdrawing } = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description?: string }) => {
      if (!user) {
        toast.error("Please login first");
        throw new Error("Not logged in");
      }

      const { data: balance } = await supabase
        .from("wallet_balances")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (!balance || balance.balance < amount) {
        toast.error("Insufficient balance");
        throw new Error("Insufficient balance");
      }

      // Create withdrawal request
      const { data, error } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: user.id,
          type: "debit",
          amount,
          description,
          reference_type: "withdrawal",
        });

      if (error) throw error;
      
      // Update balance
      await supabase
        .from("wallet_balances")
        .update({ balance: balance.balance - amount })
        .eq("user_id", user.id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-balance", "wallet-transactions"] });
      toast.success("Withdrawal request submitted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create withdrawal");
    },
  });

  return {
    balance: balance?.balance || 0,
    balanceLoading,
    transactions: transactions || [],
    transactionsLoading,
    topUp,
    isTopUpping,
    withdraw,
    isWithdrawing,
  };
};

