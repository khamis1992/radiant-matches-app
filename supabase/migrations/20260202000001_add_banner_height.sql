-- Add banner_height column to banners table
ALTER TABLE banners ADD COLUMN IF NOT EXISTS banner_height INTEGER DEFAULT 160;

-- Update existing banners to have default height
UPDATE banners SET banner_height = 160 WHERE banner_height IS NULL;
