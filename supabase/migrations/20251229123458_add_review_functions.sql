-- Add SQL functions for helpful vote counts
-- Date: 2025-12-29

-- Function to increment helpful count
CREATE OR REPLACE FUNCTION increment_helpful_count(review_id UUID)
RETURNS VOID
LANGUAGE pl
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.reviews
  SET helpful_count = helpful_count + 1
  WHERE id = review_id;
END;
$$;

-- Function to decrement helpful count
CREATE OR REPLACE FUNCTION decrement_helpful_count(review_id UUID)
RETURNS VOID
LANGUAGE pl
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.reviews
  SET helpful_count = GREATEST(0, helpful_count - 1)
  WHERE id = review_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_helpful_count TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_helpful_count TO authenticated;

