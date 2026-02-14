
-- Create new payment_transactions table
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  payment_id TEXT NOT NULL UNIQUE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('sadad', 'cash', 'stripe')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'QAR',
  status TEXT NOT NULL CHECK (status IN ('initiated', 'pending', 'success', 'failed', 'cancelled', 'refunded')),
  transaction_id TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  initiated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  refund_id TEXT,
  error_message TEXT,
  response_code TEXT,
  response_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pt_order_id ON payment_transactions(order_id);
CREATE INDEX idx_pt_status ON payment_transactions(status);
CREATE INDEX idx_pt_created_at ON payment_transactions(created_at DESC);

-- RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment transactions"
  ON payment_transactions FOR SELECT
  USING (
    order_id::uuid IN (SELECT id FROM product_orders WHERE customer_id = auth.uid())
    OR order_id::uuid IN (SELECT id FROM bookings WHERE customer_id = auth.uid())
  );

CREATE POLICY "Artists can view relevant payment transactions"
  ON payment_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_orders po
      JOIN artists a ON a.id = po.artist_id
      WHERE po.id::text = payment_transactions.order_id AND a.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM bookings b
      JOIN artists a ON a.id = b.artist_id
      WHERE b.id::text = payment_transactions.order_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payment transactions"
  ON payment_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service can insert payment transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update payment transactions"
  ON payment_transactions FOR UPDATE
  USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_transactions_updated_at();

-- Add columns to product_orders
ALTER TABLE product_orders
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT REFERENCES payment_transactions(payment_id);

CREATE INDEX IF NOT EXISTS idx_product_orders_pt
  ON product_orders(payment_transaction_id)
  WHERE payment_transaction_id IS NOT NULL;

-- Add column to bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT REFERENCES payment_transactions(payment_id);

CREATE INDEX IF NOT EXISTS idx_bookings_pt
  ON bookings(payment_transaction_id)
  WHERE payment_transaction_id IS NOT NULL;

-- Payment success handler
CREATE OR REPLACE FUNCTION handle_payment_success()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' AND OLD.status != 'success' THEN
    UPDATE product_orders
    SET status = 'processing', updated_at = NOW()
    WHERE payment_transaction_id = NEW.payment_id;

    UPDATE bookings
    SET status = 'confirmed', updated_at = NOW()
    WHERE payment_transaction_id = NEW.payment_id;
  END IF;

  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE product_orders
    SET status = 'cancelled', updated_at = NOW()
    WHERE payment_transaction_id = NEW.payment_id;

    UPDATE bookings
    SET status = 'cancelled', updated_at = NOW()
    WHERE payment_transaction_id = NEW.payment_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER handle_payment_success_trigger
  AFTER UPDATE ON payment_transactions
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION handle_payment_success();
