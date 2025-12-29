-- Create wallet_balances table for storing user wallet balances
CREATE TABLE public.wallet_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'QAR',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wallet_transactions table for transaction history
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'topup', 'payment', 'refund', 'withdrawal'
  amount NUMERIC NOT NULL,
  description TEXT,
  reference_id UUID, -- booking_id or other reference
  reference_type TEXT, -- 'booking', 'referral', 'promo'
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for wallet_balances
CREATE POLICY "Users can view own wallet balance"
ON public.wallet_balances
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet balance"
ON public.wallet_balances
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet balance"
ON public.wallet_balances
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallet balances"
ON public.wallet_balances
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all wallet balances"
ON public.wallet_balances
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for wallet_transactions
CREATE POLICY "Users can view own wallet transactions"
ON public.wallet_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet transactions"
ON public.wallet_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallet transactions"
ON public.wallet_transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all wallet transactions"
ON public.wallet_transactions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at on wallet_balances
CREATE TRIGGER update_wallet_balances_updated_at
BEFORE UPDATE ON public.wallet_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create wallet balance for new users
CREATE OR REPLACE FUNCTION public.create_wallet_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallet_balances (user_id, balance, currency)
  VALUES (NEW.id, 0, 'QAR');
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create wallet on user signup
CREATE TRIGGER on_user_created_create_wallet
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_wallet_for_new_user();