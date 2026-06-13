-- cart_abandonment_reminders.sql
-- Tracks users with non-empty carts so the hourly cron can send
-- 24 h follow-up abandonment emails even when the browser tab is closed.
--
-- Run this in your Supabase SQL editor.

CREATE TABLE IF NOT EXISTS cart_abandonment_reminders (
  user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  items           JSONB    NOT NULL DEFAULT '[]',
  total           NUMERIC  NOT NULL DEFAULT 0,
  reminder_count  INTEGER  NOT NULL DEFAULT 0,
  last_reminded_at TIMESTAMPTZ,
  next_remind_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: users can only see/modify their own row; server uses service role key
ALTER TABLE cart_abandonment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_row" ON cart_abandonment_reminders
  FOR ALL USING (auth.uid()::text = (SELECT privy_id FROM users WHERE id = user_id));

-- ── Optional: pg_cron (only if you enable the pg_cron extension first) ──────
-- In Supabase Dashboard → Database → Extensions → enable pg_cron, then run:
--
-- SELECT cron.schedule('advance-order-status', '0 * * * *', 'SELECT advance_order_status()');
--
-- The Vercel cron in vercel.json already calls /api/orders/auto-status every hour,
-- so pg_cron is optional (belt-and-suspenders only).
