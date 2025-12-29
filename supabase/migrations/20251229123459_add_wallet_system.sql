-- Add wallet system for cashback and digital payments
-- Date: 2025-12-29

-- Create wallet balances table
CREATE TABLE IF NOT EXISTS public.wallet_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'QAR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create wallet transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'credit', 'debit', 'refund'
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_id UUID,
  reference_type TEXT, -- 'booking', 'withdrawal', 'refund', 'cashback'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view own wallet balance
CREATE POLICY "Users can view own wallet balance"
ON public.wallet_balances
FOR SELECT
USING (auth.uid() = user_id);

-- Users can view own transactions
CREATE POLICY "Users can view own transactions"
ON public.wallet_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert transactions (via triggers)
CREATE POLICY "System can insert transactions"
ON public.wallet_transactions
FOR INSERT
WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallet_balances_user_id 
ON public.wallet_balances(user_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id 
ON public.wallet_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at 
ON public.wallet_transactions(created_at DESC);

-- Function to add cashback on completed bookings
CREATE OR REPLACE FUNCTION add_cashback_to_wallet(booking_id UUID)
RETURNS VOID
LANGUAGE pl
SECURITY DEFINER
AS $$
DECLARE
  customer_id UUID;
  service_amount DECIMAL(10,2);
BEGIN
  -- Get customer ID and booking amount
  SELECT b.customer_id, b.total_price
  INTO customer_id, service_amount
  FROM public.bookings b
  WHERE b.id = booking_id;
  
  -- Add 5% cashback to customer's wallet
  INSERT INTO public.wallet_transactions (user_id, type, amount, description, reference_id, reference_type)
  VALUES (
    customer_id,
    'credit',
    service_amount * 0.05,
    'Cashback from booking',
    booking_id,
    'cashback'
  );
  
  -- Update customer's wallet balance
  INSERT INTO public.wallet_balances (user_id, balance)
  VALUES (
    customer_id,
    (SELECT COALESCE(wb.balance, 0) * 1.05 FROM public.wallet_balances wb WHERE wb.user_id = customer_id)
  )
  ON CONFLICT (user_id) DO UPDATE
    SET balance = EXCLUDED.wallet_balances.balance + (service_amount * 0.05);
END;
$$;

-- Trigger to add cashback when booking is completed
CREATE OR REPLACE TRIGGER trigger_add_cashback
AFTER UPDATE OF status ON public.bookings
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION add_cashback_to_wallet(NEW.id);

-- Grant execute permission
GRANT EXECUTE ON FUNCTION add_cashback_to_wallet TO authenticated;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id 
ON public.wallet_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at 
ON public.wallet_transactions(created_at DESC);

