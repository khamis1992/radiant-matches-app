-- Create artist_invitations table for artist signup invitations
CREATE TABLE public.artist_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID
);

-- Enable RLS
ALTER TABLE public.artist_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can manage all invitations
CREATE POLICY "Admins can manage artist invitations"
ON public.artist_invitations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view invitation by token (for signup page)
CREATE POLICY "Anyone can view invitation by token"
ON public.artist_invitations
FOR SELECT
USING (true);