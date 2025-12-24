-- Create admin_invitations table
CREATE TABLE public.admin_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'admin',
  invited_by uuid NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage invitations
CREATE POLICY "Admins can manage invitations"
ON public.admin_invitations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view their invitation by token (for accepting)
CREATE POLICY "Anyone can view invitation by token"
ON public.admin_invitations
FOR SELECT
USING (true);

-- Create index for faster token lookup
CREATE INDEX idx_admin_invitations_token ON public.admin_invitations(token);
CREATE INDEX idx_admin_invitations_email ON public.admin_invitations(email);