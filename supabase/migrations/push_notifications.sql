-- Push notification subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Push notification logs
CREATE TABLE IF NOT EXISTS push_notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  recipient_count INT DEFAULT 0
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_student ON push_subscriptions(student_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications_log ENABLE ROW LEVEL SECURITY;

-- Students can only see/manage their own subscriptions
CREATE POLICY "Students manage own subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = student_id);

-- Admins can read all subscriptions (via service role key — no policy needed)
-- Push log readable by admins only (service role)
