-- Enable REPLICA IDENTITY FULL for bookings table to capture complete row data
ALTER TABLE public.bookings REPLICA IDENTITY FULL;

-- Add bookings table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;