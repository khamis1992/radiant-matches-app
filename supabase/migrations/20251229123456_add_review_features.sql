-- Add helpful votes and report review features
-- Date: 2025-12-29

-- Add helpful_count to reviews
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;

-- Add reporting columns to reviews
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS is_reported BOOLEAN DEFAULT false;

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS report_reason TEXT;

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS report_status TEXT DEFAULT 'pending';

-- Create table for helpful votes
CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Enable RLS
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- Users can view helpful votes for a review
CREATE POLICY "Users can view helpful votes"
ON public.review_helpful_votes
FOR SELECT
USING (true);

-- Users can insert their own helpful vote
CREATE POLICY "Users can insert helpful votes"
ON public.review_helpful_votes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own helpful vote
CREATE POLICY "Users can delete helpful votes"
ON public.review_helpful_votes
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review_id 
ON public.review_helpful_votes(review_id);

CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_user_id 
ON public.review_helpful_votes(user_id);

-- Create table for review replies
CREATE TABLE IF NOT EXISTS public.review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  reply TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- Users can view replies to reviews
CREATE POLICY "Users can view review replies"
ON public.review_replies
FOR SELECT
USING (true);

-- Artists can insert replies to reviews on their work
CREATE POLICY "Artists can insert replies"
ON public.review_replies
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.artists 
    WHERE public.artists.id = artist_id 
    AND public.artists.user_id = auth.uid()
  )
);

-- Users can delete their own replies
CREATE POLICY "Users can delete own replies"
ON public.review_replies
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.artists 
    WHERE public.artists.id = artist_id 
    AND public.artists.user_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_review_replies_review_id 
ON public.review_replies(review_id);

CREATE INDEX IF NOT EXISTS idx_review_replies_artist_id 
ON public.review_replies(artist_id);

