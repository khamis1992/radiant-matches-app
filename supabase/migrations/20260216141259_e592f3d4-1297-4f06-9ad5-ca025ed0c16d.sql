-- Fix: Restrict artist_invitations SELECT to admins only
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.artist_invitations;

-- Only admins can view invitations (the ALL policy already covers this, but be explicit)
CREATE POLICY "Anyone can view invitation by token"
ON public.artist_invitations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
