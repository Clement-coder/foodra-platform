-- fix_stuck_orders.sql
-- 1. Add auto-update trigger for orders.updated_at so it always reflects
--    the last time a row was changed (prevents future stuck orders).
--
-- 2. One-time fix: advance orders that are stuck because updated_at was
--    never properly set when status last changed.

-- ── Trigger ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_set_updated_at ON orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── One-time fix for stuck Processing orders ─────────────────────────────────
-- Orders stuck at Processing where updated_at = created_at (was never set
-- properly) and the order is old enough to have already passed the 24h window.
-- We back-date updated_at to 25h ago so the next cron run advances them to Shipped.
UPDATE orders
SET updated_at = NOW() - INTERVAL '25 hours'
WHERE status = 'Processing'
  AND escrow_status NOT IN ('locked', 'disputed')
  AND updated_at = created_at  -- was never updated after creation
  AND created_at <= NOW() - INTERVAL '24 hours';

-- ── One-time fix for stuck Pending orders ────────────────────────────────────
-- Orders still Pending after 24h — advance them immediately.
UPDATE orders
SET status = 'Processing', updated_at = NOW() - INTERVAL '25 hours'
WHERE status = 'Pending'
  AND escrow_status NOT IN ('locked', 'disputed')
  AND created_at <= NOW() - INTERVAL '24 hours';

-- After running this, the next cron execution (or manual call to
-- POST /api/orders/auto-status) will advance all stuck orders.
-- Manual trigger: SELECT advance_order_status();
