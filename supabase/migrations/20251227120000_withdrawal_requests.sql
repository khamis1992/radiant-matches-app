-- جدول طلبات سحب الأرباح
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  bank_name TEXT,
  account_number TEXT,
  account_holder_name TEXT,
  notes TEXT,
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهرس للبحث السريع
CREATE INDEX idx_withdrawal_requests_artist ON withdrawal_requests(artist_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);

-- Enable RLS
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- الفنانة تستطيع رؤية طلباتها فقط
CREATE POLICY "Artists can view own withdrawal requests"
ON withdrawal_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM artists 
    WHERE artists.id = withdrawal_requests.artist_id 
    AND artists.user_id = auth.uid()
  )
);

-- الفنانة تستطيع إنشاء طلب سحب
CREATE POLICY "Artists can create withdrawal requests"
ON withdrawal_requests
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM artists 
    WHERE artists.id = withdrawal_requests.artist_id 
    AND artists.user_id = auth.uid()
  )
);

-- المسؤول يستطيع رؤية وإدارة جميع الطلبات
CREATE POLICY "Admins can manage all withdrawal requests"
ON withdrawal_requests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- إضافة عمود الرصيد المتاح للفنانة
ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS available_balance DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pending_balance DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_withdrawn DECIMAL(10,2) DEFAULT 0;

-- دالة لتحديث رصيد الفنانة عند اكتمال الحجز
CREATE OR REPLACE FUNCTION update_artist_balance_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE artists
    SET available_balance = available_balance + NEW.artist_earnings,
        updated_at = NOW()
    WHERE id = NEW.artist_id;
  END IF;
  RETURN NEW;
END;
$$;

-- تفعيل الـ trigger
DROP TRIGGER IF EXISTS update_artist_balance_trigger ON bookings;
CREATE TRIGGER update_artist_balance_trigger
AFTER UPDATE OF status ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_artist_balance_on_booking();

-- دالة لتحديث الرصيد عند إنشاء طلب سحب
CREATE OR REPLACE FUNCTION handle_withdrawal_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- عند إنشاء طلب جديد، نقل المبلغ من المتاح إلى المعلق
  IF TG_OP = 'INSERT' THEN
    UPDATE artists
    SET available_balance = available_balance - NEW.amount,
        pending_balance = pending_balance + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.artist_id;
  END IF;
  
  -- عند تحديث الحالة
  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' THEN
    -- إذا تمت الموافقة والاكتمال
    IF NEW.status = 'completed' THEN
      UPDATE artists
      SET pending_balance = pending_balance - NEW.amount,
          total_withdrawn = total_withdrawn + NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.artist_id;
      
      -- إنشاء سجل معاملة
      INSERT INTO transactions (artist_id, type, amount, platform_fee, net_amount, status, description)
      VALUES (
        NEW.artist_id,
        'artist_payout',
        NEW.amount,
        0,
        NEW.amount,
        'completed',
        'Withdrawal #' || LEFT(NEW.id::TEXT, 8)
      );
    END IF;
    
    -- إذا تم الرفض، إعادة المبلغ للرصيد المتاح
    IF NEW.status = 'rejected' THEN
      UPDATE artists
      SET available_balance = available_balance + NEW.amount,
          pending_balance = pending_balance - NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.artist_id;
    END IF;
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- تفعيل الـ trigger
DROP TRIGGER IF EXISTS handle_withdrawal_request_trigger ON withdrawal_requests;
CREATE TRIGGER handle_withdrawal_request_trigger
BEFORE INSERT OR UPDATE ON withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION handle_withdrawal_request();

