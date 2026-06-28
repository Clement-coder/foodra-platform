-- 24_cron_fix_emails.sql
-- Removes all old cron jobs and installs a single correct HTTP-based job.
-- The API endpoint handles: order status advancement + email notifications
-- + cart abandonment follow-up emails — all in one call.
--
-- BEFORE RUNNING: ensure pg_net is enabled in
--   Supabase Dashboard → Database → Extensions → pg_net

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove every variant of the old jobs
DO $$
DECLARE
  jobs text[] := ARRAY['order-auto-status','order-advance-sql','cart-abandonment-remind'];
  j text;
BEGIN
  FOREACH j IN ARRAY jobs LOOP
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = j) THEN
      PERFORM cron.unschedule(j);
    END IF;
  END LOOP;
END $$;

-- Single hourly HTTP job → advances order statuses AND sends all emails
-- Replace REPLACE_WITH_YOUR_CRON_SECRET with your actual CRON_SECRET env value
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

