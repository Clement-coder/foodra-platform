-- 20_order_idempotency.sql
-- Adds idempotency_key to orders so retried POST requests return the existing order
-- instead of creating a duplicate when the network drops mid-request.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_buyer_idx
  ON orders (buyer_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
