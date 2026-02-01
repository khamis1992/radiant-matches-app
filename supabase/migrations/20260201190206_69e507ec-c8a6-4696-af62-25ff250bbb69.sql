-- Create review_helpful_votes table for tracking helpful votes on reviews
CREATE TABLE public.review_helpful_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Enable RLS
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can view vote counts
CREATE POLICY "Anyone can view helpful votes"
ON public.review_helpful_votes
FOR SELECT
USING (true);

-- Authenticated users can add their vote
CREATE POLICY "Users can add helpful votes"
ON public.review_helpful_votes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own vote
CREATE POLICY "Users can remove own helpful votes"
ON public.review_helpful_votes
FOR DELETE
USING (auth.uid() = user_id);

-- Add helpful_count column to reviews table
ALTER TABLE public.reviews ADD COLUMN helpful_count INTEGER NOT NULL DEFAULT 0;

-- Create function to update helpful_count
CREATE OR REPLACE FUNCTION public.update_review_helpful_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for automatic count updates
CREATE TRIGGER update_helpful_count_trigger
AFTER INSERT OR DELETE ON public.review_helpful_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_review_helpful_count();