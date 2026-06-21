-- ============================================================
-- 06_support.sql — Admin Support Chat
-- Run after 05_notifications.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS support_messages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  message        TEXT NOT NULL,
  image_url      TEXT,
  is_admin_reply BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_user    ON support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_created ON support_messages(created_at DESC);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support_select_own" ON support_messages FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  OR EXISTS (SELECT 1 FROM users WHERE privy_id = auth.jwt() ->> 'sub' AND role IN ('admin','owner'))
);
CREATE POLICY "support_insert_own" ON support_messages FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  OR EXISTS (SELECT 1 FROM users WHERE privy_id = auth.jwt() ->> 'sub' AND role IN ('admin','owner'))
);
