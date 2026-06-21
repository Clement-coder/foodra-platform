-- ============================================================
-- 08_disputes.sql — Order Disputes
-- Run after 01_schema.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS order_disputes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reason     TEXT NOT NULL,
  details    TEXT,
  status     TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disputes_order  ON order_disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_user   ON order_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON order_disputes(status);

ALTER TABLE order_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "disputes_select_own" ON order_disputes FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  OR EXISTS (SELECT 1 FROM users WHERE privy_id = auth.jwt() ->> 'sub' AND role IN ('admin','owner'))
);
CREATE POLICY "disputes_insert_own" ON order_disputes FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);
