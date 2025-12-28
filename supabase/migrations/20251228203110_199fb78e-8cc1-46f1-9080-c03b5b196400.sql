-- Create referral_codes table for storing user referral codes
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own referral code
CREATE POLICY "Users can view own referral code"
  ON public.referral_codes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own referral code
CREATE POLICY "Users can insert own referral code"
  ON public.referral_codes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own referral code
CREATE POLICY "Users can update own referral code"
  ON public.referral_codes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Anyone can look up a referral code (for validation during signup)
CREATE POLICY "Anyone can lookup referral codes"
  ON public.referral_codes
  FOR SELECT
  USING (true);

-- Create referrals table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reward_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view referrals they made
CREATE POLICY "Users can view own referrals"
  ON public.referrals
  FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- System can insert referrals
CREATE POLICY "System can insert referrals"
  ON public.referrals
  FOR INSERT
  WITH CHECK (true);