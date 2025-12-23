-- Add scheduling columns to banners table
ALTER TABLE public.banners 
ADD COLUMN valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update the policy for viewing active banners to include date check
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.banners;

CREATE POLICY "Anyone can view active banners"
ON public.banners
FOR SELECT
USING (
  is_active = true 
  AND (valid_from IS NULL OR valid_from <= now())
  AND (valid_until IS NULL OR valid_until > now())
);