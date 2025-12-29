-- Loyalty Points System
-- Tracks points earned and redeemed by users

-- Create loyalty points table
CREATE TABLE IF NOT EXISTS loyalty_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create loyalty transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'bonus', 'expire', 'referral')),
  description TEXT,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id ON loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_points
CREATE POLICY "Users can view own loyalty points"
  ON loyalty_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage loyalty points"
  ON loyalty_points FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for loyalty_transactions
CREATE POLICY "Users can view own transactions"
  ON loyalty_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage transactions"
  ON loyalty_transactions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to calculate tier based on lifetime points
CREATE OR REPLACE FUNCTION calculate_loyalty_tier(lifetime_pts INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF lifetime_pts >= 10000 THEN
    RETURN 'platinum';
  ELSIF lifetime_pts >= 5000 THEN
    RETURN 'gold';
  ELSIF lifetime_pts >= 1000 THEN
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to award points for completed booking
CREATE OR REPLACE FUNCTION award_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award INTEGER;
  current_points INTEGER;
  current_lifetime INTEGER;
  new_tier TEXT;
BEGIN
  -- Only process when booking is completed
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    -- Calculate points: 1 point per 10 QAR spent
    points_to_award := FLOOR(COALESCE(NEW.total_price, 0) / 10);
    
    IF points_to_award > 0 THEN
      -- Get or create loyalty points record
      INSERT INTO loyalty_points (user_id, points, lifetime_points)
      VALUES (NEW.customer_id, 0, 0)
      ON CONFLICT (user_id) DO NOTHING;
      
      -- Get current points
      SELECT points, lifetime_points INTO current_points, current_lifetime
      FROM loyalty_points WHERE user_id = NEW.customer_id;
      
      -- Update points and tier
      new_tier := calculate_loyalty_tier(current_lifetime + points_to_award);
      
      UPDATE loyalty_points
      SET 
        points = points + points_to_award,
        lifetime_points = lifetime_points + points_to_award,
        tier = new_tier,
        updated_at = NOW()
      WHERE user_id = NEW.customer_id;
      
      -- Record transaction
      INSERT INTO loyalty_transactions (user_id, points, type, description, booking_id)
      VALUES (
        NEW.customer_id,
        points_to_award,
        'earn',
        'Points earned from booking',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for awarding points
DROP TRIGGER IF EXISTS trigger_award_loyalty_points ON bookings;
CREATE TRIGGER trigger_award_loyalty_points
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION award_loyalty_points();

-- Add unique constraint for user_id in loyalty_points
ALTER TABLE loyalty_points ADD CONSTRAINT loyalty_points_user_id_unique UNIQUE (user_id);

