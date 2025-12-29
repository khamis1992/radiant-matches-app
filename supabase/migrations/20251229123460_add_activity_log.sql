-- Add activity log table
-- Date: 2025-12-29

-- Create activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can view own activity logs
CREATE POLICY "Users can view own activity logs"
ON public.activity_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Enable RLS for insert (trigger only)
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id 
ON public.activity_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
ON public.activity_logs(created_at DESC);

