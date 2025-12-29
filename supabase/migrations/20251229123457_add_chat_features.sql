-- Add read receipts and typing indicators to chat
-- Date: 2025-12-29

-- Add read_at to messages for read receipts
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Create index for read receipts performance
CREATE INDEX IF NOT EXISTS idx_messages_read_at 
ON public.messages(read_at);

-- Create table for typing indicators
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Enable RLS
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- Users can view typing indicators in their conversations
CREATE POLICY "Users can view typing indicators"
ON public.typing_indicators
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE public.conversations.id = typing_indicators.conversation_id
    AND (public.conversations.customer_id = auth.uid() OR public.conversations.artist_id = auth.uid())
  )
);

-- Users can insert/update typing indicators for themselves
CREATE POLICY "Users can update typing indicators"
ON public.typing_indicators
FOR ALL
WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_id 
ON public.typing_indicators(conversation_id);

CREATE INDEX IF NOT EXISTS idx_typing_indicators_updated_at 
ON public.typing_indicators(updated_at);

