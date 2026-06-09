-- order_auto_status.sql
-- Automatically advances order status based on time:
--   Pending    → Processing after 24 hours (from created_at)
--   Processing → Shipped   after 24 hours (from updated_at, i.e. 24h after becoming Processing)
-- Only advances orders that are NOT in a terminal state and have no locked/disputed escrow.
--
-- Run in Supabase SQL editor, then schedule via pg_cron or call /api/orders/auto-status

CREATE OR REPLACE FUNCTION advance_order_status()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
  row_count     INTEGER := 0;
BEGIN
  -- Pending → Processing (24 hours after order was created)
  UPDATE orders
  SET status = 'Processing', updated_at = NOW()
  WHERE status = 'Pending'
    AND escrow_status NOT IN ('locked', 'disputed')
    AND created_at <= NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS row_count = ROW_COUNT;
  updated_count := updated_count + row_count;

  -- Processing → Shipped (24 hours after status became Processing, tracked via updated_at)
  UPDATE orders
  SET status = 'Shipped', updated_at = NOW()
  WHERE status = 'Processing'
    AND escrow_status NOT IN ('locked', 'disputed')
    AND updated_at <= NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS row_count = ROW_COUNT;
  updated_count := updated_count + row_count;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: schedule with pg_cron (requires pg_cron extension enabled in Supabase)
-- Run every hour:
-- SELECT cron.schedule('advance-order-status', '0 * * * *', 'SELECT advance_order_status()');

-- Manual test: SELECT advance_order_status();
