
-- Permanent security audit log - never deleted even when accounts are removed
CREATE TABLE public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL, -- 'signup', 'login', 'logout', 'account_deleted', 'ip_blocked', 'password_reset', 'role_change', 'portfolio_upload'
  user_id uuid, -- may be null after account deletion
  email text,
  full_name text,
  ip_address text,
  user_agent text,
  country_code text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_security_audit_email ON public.security_audit_log (email);
CREATE INDEX idx_security_audit_ip ON public.security_audit_log (ip_address);
CREATE INDEX idx_security_audit_user_id ON public.security_audit_log (user_id);
CREATE INDEX idx_security_audit_created_at ON public.security_audit_log (created_at DESC);
CREATE INDEX idx_security_audit_event_type ON public.security_audit_log (event_type);

-- Enable RLS
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view
CREATE POLICY "Admins can view security audit logs"
  ON public.security_audit_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- No one can delete or update (immutable log)
-- Insert allowed via service role in edge functions only
