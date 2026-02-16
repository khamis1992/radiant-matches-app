
-- Fix SECURITY DEFINER view issue - recreate as SECURITY INVOKER
DROP VIEW IF EXISTS public.instagram_connections_safe;
CREATE VIEW public.instagram_connections_safe 
WITH (security_invoker = true) AS
SELECT id, artist_id, instagram_user_id, instagram_username, 
       token_expires_at, account_type, created_at, updated_at
FROM public.instagram_connections;

GRANT SELECT ON public.instagram_connections_safe TO authenticated;
GRANT SELECT ON public.instagram_connections_safe TO anon;
