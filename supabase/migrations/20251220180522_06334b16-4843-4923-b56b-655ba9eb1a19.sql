-- Add display_order column for drag-and-drop reordering
ALTER TABLE public.portfolio_items 
ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;

-- Set initial order based on created_at
UPDATE public.portfolio_items 
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY artist_id ORDER BY created_at) as row_num
  FROM public.portfolio_items
) AS subquery
WHERE public.portfolio_items.id = subquery.id;

-- Create index for ordering
CREATE INDEX idx_portfolio_items_order ON public.portfolio_items(artist_id, display_order);