-- Add image_scale column to banners table for zoom control
ALTER TABLE public.banners 
ADD COLUMN image_scale integer NOT NULL DEFAULT 100;

-- Add comment for clarity
COMMENT ON COLUMN public.banners.image_scale IS 'Image scale/zoom percentage (50-200, default 100)';