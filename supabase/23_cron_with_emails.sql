-- 23_cron_with_emails.sql
-- Supabase pg_cron + pg_net: hourly cron that calls the app API.
-- The API handles: Pending→Processing, Processing→Shipped emails + cart abandonment.
--
-- BEFORE RUNNING:
--   1. Enable pg_net in Supabase Dashboard → Database → Extensions → pg_net
--   2. Replace REPLACE_WITH_YOUR_CRON_SECRET with your actual CRON_SECRET value
--
-- Run in Supabase SQL editor.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any existing jobs cleanly
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'order-advance-sql') THEN
    PERFORM cron.unschedule('order-advance-sql');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'order-auto-status') THEN
    PERFORM cron.unschedule('order-auto-status');
  END IF;
END $$;

-- Hourly job: POST to app API → advances statuses + sends all emails
SELECT cron.schedule(
  'order-auto-status',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url     => 'https://foodramarket.com/api/orders/auto-status',
    headers => jsonb_build_object(
      'Content-Type',  'application/json',
      'x-cron-secret', 'REPLACE_WITH_YOUR_CRON_SECRET'
    ),
    body    => '{}'::jsonb
  );
  $$
);
