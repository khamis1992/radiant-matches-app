-- Create biometric_credentials table for fingerprint/face ID login
CREATE TABLE public.biometric_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  device_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.biometric_credentials ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own credentials
CREATE POLICY "Users can view their own biometric credentials"
ON public.biometric_credentials
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own biometric credentials"
ON public.biometric_credentials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own biometric credentials"
ON public.biometric_credentials
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own biometric credentials"
ON public.biometric_credentials
FOR UPDATE
USING (auth.uid() = user_id);