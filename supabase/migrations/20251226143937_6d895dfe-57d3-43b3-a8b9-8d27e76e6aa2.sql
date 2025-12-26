-- Add payment columns to bookings table
ALTER TABLE public.bookings
ADD COLUMN payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'sadad')),
ADD COLUMN sadad_order_id TEXT,
ADD COLUMN sadad_transaction_id TEXT;

-- Create payment_transactions table for tracking all payment attempts
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'QAR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payment_method TEXT NOT NULL DEFAULT 'sadad',
  sadad_order_id TEXT,
  sadad_transaction_number TEXT,
  response_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Customers can view their own payment transactions
CREATE POLICY "Customers can view own payment transactions"
ON public.payment_transactions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.bookings
  WHERE bookings.id = payment_transactions.booking_id
  AND bookings.customer_id = auth.uid()
));

-- Artists can view payment transactions for their bookings
CREATE POLICY "Artists can view payment transactions for their bookings"
ON public.payment_transactions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.bookings b
  JOIN public.artists a ON a.id = b.artist_id
  WHERE b.id = payment_transactions.booking_id
  AND a.user_id = auth.uid()
));

-- Admins can view all payment transactions
CREATE POLICY "Admins can view all payment transactions"
ON public.payment_transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert payment transactions (for edge functions)
CREATE POLICY "System can insert payment transactions"
ON public.payment_transactions
FOR INSERT
WITH CHECK (true);

-- System can update payment transactions (for callbacks)
CREATE POLICY "System can update payment transactions"
ON public.payment_transactions
FOR UPDATE
USING (true);

-- Add trigger for updating updated_at
CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_payment_transactions_booking_id ON public.payment_transactions(booking_id);
CREATE INDEX idx_payment_transactions_sadad_order_id ON public.payment_transactions(sadad_order_id);
CREATE INDEX idx_bookings_sadad_order_id ON public.bookings(sadad_order_id);