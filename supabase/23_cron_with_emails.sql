-- 23_cron_with_emails.sql
-- Replaces the pure-SQL cron with one that also triggers emails via pg_net.
-- Requires pg_net extension enabled in Supabase Dashboard → Database → Extensions.
-- Run in Supabase SQL editor.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing jobs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'order-advance-sql') THEN
    PERFORM cron.unschedule('order-advance-sql');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'order-auto-status') THEN
    PERFORM cron.unschedule('order-auto-status');
  END IF;
END $$;

-- Single hourly job: advances statuses + triggers email API
SELECT cron.schedule(
  'order-auto-status',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://foodramarket.com/api/orders/auto-status',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "REPLACE_WITH_YOUR_CRON_SECRET"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
