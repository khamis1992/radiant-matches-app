-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  artist_id UUID NOT NULL,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, artist_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
USING (
  auth.uid() = customer_id OR 
  EXISTS (SELECT 1 FROM artists WHERE artists.id = conversations.artist_id AND artists.user_id = auth.uid())
);

CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update their own conversations"
ON public.conversations
FOR UPDATE
USING (
  auth.uid() = customer_id OR 
  EXISTS (SELECT 1 FROM artists WHERE artists.id = conversations.artist_id AND artists.user_id = auth.uid())
);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (
      conversations.customer_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM artists WHERE artists.id = conversations.artist_id AND artists.user_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (
      conversations.customer_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM artists WHERE artists.id = conversations.artist_id AND artists.user_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can update messages they received"
ON public.messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (
      conversations.customer_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM artists WHERE artists.id = conversations.artist_id AND artists.user_id = auth.uid())
    )
  )
);

-- Create trigger to update conversation's last_message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;