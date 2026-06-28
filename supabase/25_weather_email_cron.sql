-- 25_weather_email_cron.sql
-- Daily weather forecast + extreme alert emails via pg_cron + pg_net.
-- Runs at 6:00 AM WAT (West Africa Time = UTC+1) → 5:00 AM UTC.
--
-- BEFORE RUNNING:
--   1. Ensure pg_net is enabled: Supabase Dashboard → Database → Extensions → pg_net
--   2. Replace REPLACE_WITH_YOUR_CRON_SECRET with your actual CRON_SECRET value

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing job if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weather-daily-email') THEN
    PERFORM cron.unschedule('weather-daily-email');
  END IF;
END $$;

-- Daily at 5:00 AM UTC (6:00 AM WAT)
SELECT cron.schedule(
  'weather-daily-email',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url     => 'https://foodramarket.com/api/weather-email',
    headers => jsonb_build_object(
      'Content-Type',  'application/json',
      'x-cron-secret', 'REPLACE_WITH_YOUR_CRON_SECRET'
    ),
    body    => '{}'::jsonb
  );
  $$
);
