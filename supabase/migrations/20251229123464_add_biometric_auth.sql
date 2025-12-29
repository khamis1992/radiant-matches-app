-- Biometric Authentication System
-- Stores WebAuthn credentials for fingerprint/Face ID login

-- Create biometric credentials table
CREATE TABLE IF NOT EXISTS biometric_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  device_name TEXT NOT NULL DEFAULT 'Unknown Device',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_biometric_user_id ON biometric_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_credential_id ON biometric_credentials(credential_id);

-- Enable RLS
ALTER TABLE biometric_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own biometric credentials"
  ON biometric_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own biometric credentials"
  ON biometric_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own biometric credentials"
  ON biometric_credentials FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own biometric credentials"
  ON biometric_credentials FOR UPDATE
  USING (auth.uid() = user_id);

