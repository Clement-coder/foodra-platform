-- ============================================================
-- 18_cron_fix.sql
-- Replace HTTP-based cron jobs with pure-SQL jobs.
-- No pg_net required. No URL or secret to configure.
-- Run in Supabase SQL editor.
-- ============================================================

-- Ensure pg_cron is enabled (it is on Supabase by default)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ── Remove old HTTP-based jobs if they exist ─────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'order-auto-status') THEN
    PERFORM cron.unschedule('order-auto-status');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cart-abandonment-remind') THEN
    PERFORM cron.unschedule('cart-abandonment-remind');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'order-advance-sql') THEN
    PERFORM cron.unschedule('order-advance-sql');
  END IF;
END $$;

-- ── Pure-SQL order advancement — runs every hour ─────────────────────────────
-- Pending → Processing : 24h after paid_at
-- Processing → Shipped : 24h after updated_at
-- Shipped stays Shipped until buyer manually confirms Delivered
SELECT cron.schedule(
  'order-advance-sql',
  '0 * * * *',
  $$
  -- Pending → Processing (24h after payment)
  UPDATE orders
    SET status     = 'Processing',
        updated_at = now()
  WHERE status      = 'Pending'
    AND wallet_paid = true
    AND paid_at    <= now() - interval '24 hours';

  -- Processing → Shipped (24h after last update)
  UPDATE orders
    SET status     = 'Shipped',
        updated_at = now(),
        shipped_at = now()
  WHERE status     = 'Processing'
    AND updated_at <= now() - interval '24 hours';
  $$
);
