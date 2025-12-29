-- Two-Factor Authentication System
-- Adds 2FA support via TOTP (Time-based One-Time Password)

-- Create user 2FA settings table
CREATE TABLE IF NOT EXISTS user_2fa_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  secret_key TEXT, -- Encrypted TOTP secret
  backup_codes TEXT[], -- Array of encrypted backup codes
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create 2FA verification attempts log
CREATE TABLE IF NOT EXISTS two_fa_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('totp', 'backup_code', 'email')),
  success BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_2fa_settings_user_id ON user_2fa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_attempts_user_id ON two_fa_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_attempts_created_at ON two_fa_attempts(created_at DESC);

-- Enable RLS
ALTER TABLE user_2fa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_fa_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_2fa_settings
CREATE POLICY "Users can view own 2FA settings"
  ON user_2fa_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own 2FA settings"
  ON user_2fa_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2FA settings"
  ON user_2fa_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for two_fa_attempts
CREATE POLICY "Users can view own 2FA attempts"
  ON two_fa_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert 2FA attempts"
  ON two_fa_attempts FOR INSERT
  WITH CHECK (true);

-- Function to check for suspicious 2FA activity
CREATE OR REPLACE FUNCTION check_2fa_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  failed_attempts INTEGER;
BEGIN
  -- Count failed attempts in the last 15 minutes
  SELECT COUNT(*) INTO failed_attempts
  FROM two_fa_attempts
  WHERE user_id = p_user_id
    AND success = false
    AND created_at > NOW() - INTERVAL '15 minutes';
  
  -- Block if more than 5 failed attempts
  RETURN failed_attempts < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

