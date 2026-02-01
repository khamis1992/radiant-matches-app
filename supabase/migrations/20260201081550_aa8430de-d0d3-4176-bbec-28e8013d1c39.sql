
-- Add SELECT policy for admins to view all banners
CREATE POLICY "Admins can view all banners" 
ON public.banners 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));
