-- ============================================================
-- 16_pg_cron.sql
-- Supabase-native cron jobs using pg_cron + pg_net
-- Run in Supabase SQL editor (requires pg_cron and pg_net extensions)
--
-- pg_cron:  enabled by default on Supabase (Settings → Database → Extensions)
-- pg_net:   enable in Supabase Dashboard → Database → Extensions → pg_net
--
-- Replace YOUR_APP_URL with your production URL, e.g. https://foodramarket.com
-- Replace YOUR_CRON_SECRET with the value in your .env CRON_SECRET
-- ============================================================

-- Enable extensions (safe to run even if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── Remove any existing jobs before re-creating ──────────────────────────────
SELECT cron.unschedule('order-auto-status') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'order-auto-status'
);

SELECT cron.unschedule('cart-abandonment-remind') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cart-abandonment-remind'
);

-- ── 1. Order status advancement — runs every hour ────────────────────────────
-- Advances: Pending → Processing (24h after paid_at)
--           Processing → Shipped  (24h after updated_at)
-- Notifies buyers and sends emails via the app API.
SELECT cron.schedule(
  'order-auto-status',
  '0 * * * *',   -- every hour on the hour
  $$
  SELECT net.http_post(
    url     := 'YOUR_APP_URL/api/orders/auto-status',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "YOUR_CRON_SECRET"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);

-- ── 2. Cart abandonment reminders — runs every hour ──────────────────────────
-- Picks up rows in cart_abandonment_reminders where next_remind_at <= now()
-- (first reminder fires 1h after cart becomes idle, then every 24h)
-- This reuses the same auto-status endpoint which handles both concerns.
-- Already handled inside the order-auto-status job above — no separate job needed.

-- ── Alternatively: pure-SQL order advancement (no HTTP, no emails) ───────────
-- Uncomment the block below if you prefer DB-only advancement without emails.
-- The HTTP job above is recommended because it also sends email notifications.
--
-- SELECT cron.schedule(
--   'order-advance-sql',
--   '0 * * * *',
--   $$
--   -- Pending → Processing (24h after paid_at)
--   UPDATE orders
--     SET status = 'Processing', updated_at = now()
--   WHERE status = 'Pending'
--     AND wallet_paid = true
--     AND paid_at <= now() - interval '24 hours';
--
--   -- Processing → Shipped (24h after updated_at)
--   UPDATE orders
--     SET status = 'Shipped', updated_at = now()
--   WHERE status = 'Processing'
--     AND updated_at <= now() - interval '24 hours';
--   $$
-- );
