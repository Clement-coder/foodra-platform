-- cart_abandonment_reminders.sql
-- Tracks users with non-empty carts so the daily cron can send
-- 24 h follow-up abandonment emails even when the browser tab is closed.
--
-- Run this in your Supabase SQL editor.

CREATE TABLE IF NOT EXISTS cart_abandonment_reminders (
  user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  items            JSONB       NOT NULL DEFAULT '[]',
  total            NUMERIC     NOT NULL DEFAULT 0,
  reminder_count   INTEGER     NOT NULL DEFAULT 0,
  last_reminded_at TIMESTAMPTZ,
  next_remind_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: server uses service role key (bypasses RLS); no direct client access needed
ALTER TABLE cart_abandonment_reminders ENABLE ROW LEVEL SECURITY;

-- ── pg_cron: run every hour inside Supabase (replaces Vercel hourly cron) ────
-- Vercel Hobby plan only allows once-per-day crons.
-- pg_cron runs advance_order_status() every hour directly in Postgres for free.
--
-- STEP 1: Enable pg_cron in Supabase Dashboard → Database → Extensions → pg_cron
-- STEP 2: Run this line:
--
--   SELECT cron.schedule('advance-order-status', '0 * * * *', 'SELECT advance_order_status()');
--
-- To verify it's scheduled:
--   SELECT * FROM cron.job;
--
-- To remove it later:
--   SELECT cron.unschedule('advance-order-status');
--
-- The Vercel cron (daily at 2am) still runs as a backup and handles
-- cart abandonment email follow-ups via the cart_abandonment_reminders table.
