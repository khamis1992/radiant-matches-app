
-- Table to store email verification OTP codes
CREATE TABLE public.email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  otp_code text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification records
CREATE POLICY "Users can view own verifications"
ON public.email_verifications
FOR SELECT
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_email_verifications_user_email ON public.email_verifications (user_id, email);
CREATE INDEX idx_email_verifications_expires ON public.email_verifications (expires_at);

-- Auto-cleanup old records (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_expired_verifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.email_verifications
  WHERE expires_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_cleanup_expired_verifications
AFTER INSERT ON public.email_verifications
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_verifications();
