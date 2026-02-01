-- Add image_fit column to control how image fills the banner
ALTER TABLE public.banners 
ADD COLUMN image_fit text NOT NULL DEFAULT 'cover';

-- Add comment for clarity
COMMENT ON COLUMN public.banners.image_fit IS 'How image fits in banner: cover (fill, may crop) or contain (show full image)';