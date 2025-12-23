-- 1. جدول المعاملات المالية
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('booking_payment', 'platform_fee', 'artist_payout', 'refund')),
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Artists can view own transactions"
ON public.transactions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.artists
  WHERE artists.id = transactions.artist_id
  AND artists.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all transactions"
ON public.transactions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 2. إضافة أعمدة العمولة للحجوزات
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS artist_earnings DECIMAL(10,2);

-- 3. جدول أكواد الخصم
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promo_codes
CREATE POLICY "Anyone can view active promo codes"
ON public.promo_codes
FOR SELECT
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 4. إضافة عمود كود الخصم للحجوزات
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES public.promo_codes(id),
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- 5. جدول إعدادات النظام
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for platform_settings
CREATE POLICY "Anyone can view platform settings"
ON public.platform_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage platform settings"
ON public.platform_settings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 6. إدراج إعدادات النظام الافتراضية
INSERT INTO public.platform_settings (key, value, description) VALUES
('commission_rate', '{"rate": 15}', 'نسبة العمولة على الحجوزات (%)'),
('platform_name', '{"en": "Glam", "ar": "جلام"}', 'اسم المنصة')
ON CONFLICT (key) DO NOTHING;

-- 7. Trigger لحساب العمولة تلقائياً عند إنشاء حجز
CREATE OR REPLACE FUNCTION public.calculate_booking_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  commission_rate DECIMAL;
BEGIN
  -- Get commission rate from settings
  SELECT (value->>'rate')::DECIMAL INTO commission_rate
  FROM public.platform_settings
  WHERE key = 'commission_rate';
  
  -- Default to 15% if not set
  IF commission_rate IS NULL THEN
    commission_rate := 15;
  END IF;
  
  -- Calculate fees
  NEW.platform_fee := ROUND((NEW.total_price * commission_rate / 100)::NUMERIC, 2);
  NEW.artist_earnings := NEW.total_price - NEW.platform_fee - COALESCE(NEW.discount_amount, 0);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_booking_commission_trigger
BEFORE INSERT OR UPDATE OF total_price, discount_amount ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.calculate_booking_commission();

-- 8. Trigger لإنشاء معاملة مالية عند اكتمال الحجز
CREATE OR REPLACE FUNCTION public.create_booking_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO public.transactions (booking_id, artist_id, type, amount, platform_fee, net_amount, status, description)
    VALUES (
      NEW.id,
      NEW.artist_id,
      'booking_payment',
      NEW.total_price,
      NEW.platform_fee,
      NEW.artist_earnings,
      'completed',
      'Payment for booking #' || LEFT(NEW.id::TEXT, 8)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_booking_transaction_trigger
AFTER UPDATE OF status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.create_booking_transaction();

-- Enable realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;