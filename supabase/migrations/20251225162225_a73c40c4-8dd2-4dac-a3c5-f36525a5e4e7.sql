-- Add booking_id column to conversations table
ALTER TABLE public.conversations 
ADD COLUMN booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_conversations_booking_id ON public.conversations(booking_id);