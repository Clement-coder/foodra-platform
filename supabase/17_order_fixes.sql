-- ============================================================
-- 17_order_fixes.sql
-- 1. decrement_product_stock RPC (fixes order creation)
-- 2. Cart abandonment reminder cleanup trigger
-- Run in Supabase SQL editor after 16_pg_cron.sql
-- ============================================================

-- ── decrement_product_stock ────────────────────────────────────────────────
-- Atomically decrements product quantity.
-- Returns TRUE if stock was sufficient and decremented, FALSE otherwise.
-- Called during order creation to validate and reserve stock.
CREATE OR REPLACE FUNCTION decrement_product_stock(product_id UUID, decrement_by INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_qty INTEGER;
BEGIN
  -- Lock the row to prevent concurrent over-selling
  SELECT quantity INTO current_qty
  FROM products
  WHERE id = product_id
  FOR UPDATE;

  IF current_qty IS NULL THEN
    RETURN FALSE;
  END IF;

  IF current_qty < decrement_by THEN
    RETURN FALSE;
  END IF;

  UPDATE products
  SET
    quantity     = quantity - decrement_by,
    is_available = (quantity - decrement_by) > 0,
    updated_at   = NOW()
  WHERE id = product_id;

  RETURN TRUE;
END;
$$;

-- Grant execute to authenticated and service role
GRANT EXECUTE ON FUNCTION decrement_product_stock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_product_stock(UUID, INTEGER) TO service_role;

-- ── Auto-clear cart_abandonment_reminders when order is paid ──────────────
-- When wallet_paid becomes true on an order, remove the buyer's reminder row
-- so they don't keep getting cart abandonment emails.
CREATE OR REPLACE FUNCTION clear_cart_reminder_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.wallet_paid = true AND (OLD.wallet_paid IS DISTINCT FROM true) THEN
    DELETE FROM cart_abandonment_reminders WHERE user_id = NEW.buyer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clear_cart_reminder ON orders;
CREATE TRIGGER trg_clear_cart_reminder
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION clear_cart_reminder_on_payment();
