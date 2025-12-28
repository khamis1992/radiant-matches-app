-- Create referral system tables
-- These tables will allow users to earn rewards for referring new users

-- Table 1: referral_codes
-- Stores unique referral codes for each user
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::now()) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON public.referral_codes(active);

-- Table 2: referrals
-- Tracks all successful referrals and their rewards
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    referred_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed')),
    reward_amount INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON public.referrals(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes
-- Users can only view and update their own referral codes
CREATE POLICY "Users can view own referral codes"
    ON public.referral_codes FOR SELECT
    USING (auth.uid() = user_id::text);

CREATE POLICY "Users can insert own referral codes"
    ON public.referral_codes FOR INSERT
    WITH CHECK (auth.uid() = user_id::text);

CREATE POLICY "Users can update own referral codes"
    ON public.referral_codes FOR UPDATE
    USING (auth.uid() = user_id::text);

-- RLS Policies for referrals
-- Users can view their own referrals
CREATE POLICY "Users can view own referrals"
    ON public.referrals FOR SELECT
    USING (auth.uid() = referrer_id::text);

-- Users can insert referrals when they are referrer
CREATE POLICY "Users can insert referrals"
    ON public.referrals FOR INSERT
    WITH CHECK (auth.uid() = referrer_id::text);

-- Grant permissions
GRANT ALL ON public.referral_codes TO authenticated;
GRANT ALL ON public.referrals TO authenticated;

