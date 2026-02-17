
-- Drop the permissive INSERT policy
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;

-- Create a secure SECURITY DEFINER function to create referrals
CREATE OR REPLACE FUNCTION public.create_referral(p_referral_code TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_referrer_id UUID;
  v_existing INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate referral code exists and is active
  SELECT user_id INTO v_referrer_id
  FROM public.referral_codes
  WHERE code = p_referral_code AND active = true;

  IF v_referrer_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive referral code';
  END IF;

  -- Cannot refer yourself
  IF v_referrer_id = v_user_id THEN
    RAISE EXCEPTION 'Cannot use your own referral code';
  END IF;

  -- Check if this user was already referred
  SELECT COUNT(*) INTO v_existing
  FROM public.referrals
  WHERE referred_id = v_user_id;

  IF v_existing > 0 THEN
    RAISE EXCEPTION 'Already referred';
  END IF;

  -- Create the referral record
  INSERT INTO public.referrals (referrer_id, referred_id, status)
  VALUES (v_referrer_id, v_user_id, 'pending');
END;
$$;

-- Only authenticated users can call this function
REVOKE ALL ON FUNCTION public.create_referral(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_referral(TEXT) TO authenticated;
