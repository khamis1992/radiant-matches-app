-- Marketing Campaigns System
-- Admin tools for creating and managing promotional campaigns

-- Create campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('discount', 'promo_code', 'banner', 'push_notification', 'email')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
  
  -- Campaign settings
  discount_percent INTEGER,
  discount_amount NUMERIC(10, 2),
  promo_code TEXT UNIQUE,
  min_order_amount NUMERIC(10, 2),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  
  -- Targeting
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'new_users', 'returning_users', 'inactive_users', 'high_value')),
  target_services TEXT[], -- Array of service categories
  
  -- Schedule
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  -- Analytics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_generated NUMERIC(10, 2) DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create campaign analytics table
CREATE TABLE IF NOT EXISTS campaign_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click', 'conversion', 'redemption')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON marketing_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_promo_code ON marketing_campaigns(promo_code);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign_id ON campaign_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_event_type ON campaign_analytics(event_type);

-- Enable RLS
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage campaigns"
  ON marketing_campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Everyone can view active campaigns"
  ON marketing_campaigns FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage campaign analytics"
  ON campaign_analytics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can track their own analytics"
  ON campaign_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Function to auto-update campaign status based on dates
CREATE OR REPLACE FUNCTION update_campaign_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-activate scheduled campaigns
  IF NEW.status = 'scheduled' AND NEW.start_date <= NOW() THEN
    NEW.status := 'active';
  END IF;
  
  -- Auto-complete active campaigns past end date
  IF NEW.status = 'active' AND NEW.end_date IS NOT NULL AND NEW.end_date < NOW() THEN
    NEW.status := 'completed';
  END IF;
  
  -- Auto-complete campaigns that reached max uses
  IF NEW.status = 'active' AND NEW.max_uses IS NOT NULL AND NEW.current_uses >= NEW.max_uses THEN
    NEW.status := 'completed';
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status updates
DROP TRIGGER IF EXISTS trigger_update_campaign_status ON marketing_campaigns;
CREATE TRIGGER trigger_update_campaign_status
  BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_status();

-- Function to track campaign analytics
CREATE OR REPLACE FUNCTION track_campaign_event(
  p_campaign_id UUID,
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_booking_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO campaign_analytics (campaign_id, event_type, user_id, booking_id, metadata)
  VALUES (p_campaign_id, p_event_type, p_user_id, p_booking_id, p_metadata);
  
  -- Update campaign counters
  IF p_event_type = 'impression' THEN
    UPDATE marketing_campaigns SET impressions = impressions + 1 WHERE id = p_campaign_id;
  ELSIF p_event_type = 'click' THEN
    UPDATE marketing_campaigns SET clicks = clicks + 1 WHERE id = p_campaign_id;
  ELSIF p_event_type = 'conversion' THEN
    UPDATE marketing_campaigns SET conversions = conversions + 1 WHERE id = p_campaign_id;
  ELSIF p_event_type = 'redemption' THEN
    UPDATE marketing_campaigns SET current_uses = current_uses + 1 WHERE id = p_campaign_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

