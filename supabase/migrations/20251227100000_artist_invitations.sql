-- جدول دعوات الفنانات
CREATE TABLE IF NOT EXISTS artist_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهرس للبحث السريع بالـ token
CREATE INDEX idx_artist_invitations_token ON artist_invitations(token);

-- السماح للمسؤولين فقط بإنشاء الدعوات
ALTER TABLE artist_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invitations" ON artist_invitations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- السماح لأي شخص بقراءة الدعوة الخاصة به باستخدام الـ token (للتحقق)
CREATE POLICY "Anyone can read invitation by token" ON artist_invitations
  FOR SELECT
  TO anon, authenticated
  USING (true);
