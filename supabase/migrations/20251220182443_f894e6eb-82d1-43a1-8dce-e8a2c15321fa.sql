-- Add is_featured column to portfolio_items
ALTER TABLE public.portfolio_items
ADD COLUMN is_featured boolean NOT NULL DEFAULT false;

-- Create function to ensure only one featured image per artist
CREATE OR REPLACE FUNCTION public.ensure_single_featured_portfolio()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_featured = true THEN
    UPDATE public.portfolio_items
    SET is_featured = false
    WHERE artist_id = NEW.artist_id AND id != NEW.id AND is_featured = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to enforce single featured image
CREATE TRIGGER ensure_single_featured_portfolio_trigger
BEFORE INSERT OR UPDATE ON public.portfolio_items
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_featured_portfolio();