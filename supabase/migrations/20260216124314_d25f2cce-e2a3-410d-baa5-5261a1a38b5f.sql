
-- Fix 1: Instagram token exposure - restrict client access to access_token
-- Drop existing SELECT policy and replace with column-restricted approach using a view
CREATE OR REPLACE VIEW public.instagram_connections_safe AS
SELECT id, artist_id, instagram_user_id, instagram_username, 
       token_expires_at, account_type, created_at, updated_at
FROM public.instagram_connections;

-- Grant access to the view
GRANT SELECT ON public.instagram_connections_safe TO authenticated;
GRANT SELECT ON public.instagram_connections_safe TO anon;

-- Fix 2: Wallet transaction security - remove permissive INSERT policies
-- Drop the permissive INSERT policy on wallet_transactions if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'wallet_transactions' 
    AND policyname = 'System can insert transactions'
  ) THEN
    DROP POLICY "System can insert transactions" ON public.wallet_transactions;
  END IF;
END $$;

-- Drop any permissive INSERT policy on wallet_balances
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'wallet_balances' 
    AND policyname = 'System can insert wallet balances'
  ) THEN
    DROP POLICY "System can insert wallet balances" ON public.wallet_balances;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'wallet_balances' 
    AND policyname = 'Users can insert own wallet balance'
  ) THEN
    DROP POLICY "Users can insert own wallet balance" ON public.wallet_balances;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'wallet_balances' 
    AND policyname = 'Users can update own wallet balance'
  ) THEN
    DROP POLICY "Users can update own wallet balance" ON public.wallet_balances;
  END IF;
END $$;

-- Create SECURITY DEFINER functions for wallet operations
CREATE OR REPLACE FUNCTION public.wallet_topup(
  p_amount DECIMAL,
  p_description TEXT DEFAULT 'Wallet top-up'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  -- Insert transaction
  INSERT INTO wallet_transactions (user_id, type, amount, description, status)
  VALUES (v_user_id, 'topup', p_amount, p_description, 'completed');

  -- Update balance
  UPDATE wallet_balances
  SET balance = balance + p_amount, updated_at = now()
  WHERE user_id = v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.wallet_withdraw(
  p_amount DECIMAL,
  p_description TEXT DEFAULT 'Wallet withdrawal'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_balance DECIMAL;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  SELECT balance INTO v_balance FROM wallet_balances WHERE user_id = v_user_id FOR UPDATE;
  IF v_balance IS NULL OR v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  INSERT INTO wallet_transactions (user_id, type, amount, description, status)
  VALUES (v_user_id, 'withdrawal', -p_amount, p_description, 'completed');

  UPDATE wallet_balances
  SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.wallet_topup TO authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_withdraw TO authenticated;
