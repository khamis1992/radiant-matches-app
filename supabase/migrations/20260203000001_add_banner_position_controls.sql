-- Add image position controls to banners table
ALTER TABLE banners ADD COLUMN IF NOT EXISTS position_x INTEGER DEFAULT 50;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS position_y INTEGER DEFAULT 50;

-- Update existing banners to center position
UPDATE banners SET position_x = 50, position_y = 50 WHERE position_x IS NULL OR position_y IS NULL;

-- Add constraint to ensure position values are within valid range (0-100)
ALTER TABLE banners DROP CONSTRAINT IF EXISTS check_position_x;
ALTER TABLE banners DROP CONSTRAINT IF EXISTS check_position_y;
ALTER TABLE banners ADD CONSTRAINT check_position_x CHECK (position_x >= 0 AND position_x <= 100);
ALTER TABLE banners ADD CONSTRAINT check_position_y CHECK (position_y >= 0 AND position_y <= 100);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_banners_position ON banners(position_x, position_y);
