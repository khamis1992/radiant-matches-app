
-- Create blocked_ips table
CREATE TABLE public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  reason TEXT,
  blocked_by UUID,
  blocked_user_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can manage blocked IPs"
ON public.blocked_ips
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Allow service role / edge functions to read (for check-blocked-ip)
CREATE POLICY "Service can read blocked IPs"
ON public.blocked_ips
FOR SELECT
USING (true);
