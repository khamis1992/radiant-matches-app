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

/**
 * Hook for customer wallet
 * Note: This feature requires wallet_balances and wallet_transactions tables
 */
export const useWallet = () => {
  return {
    balance: 0,
    balanceLoading: false,
    transactions: [] as WalletTransaction[],
    transactionsLoading: false,
    topUp: (_params: { amount: number; description?: string }) => {
      console.log("Wallet not configured - tables not available");
    },
    isTopUpping: false,
    withdraw: (_params: { amount: number; description?: string }) => {
      console.log("Wallet not configured - tables not available");
    },
    isWithdrawing: false,
  };
};
