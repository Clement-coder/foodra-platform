-- 22_orders_missing_columns.sql
-- Adds all columns the checkout route needs that are missing from the live orders table.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS wallet_paid             BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS wallet_tx_id            UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at                 TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_full_name      TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_phone          TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address        TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_street2        TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_landmark       TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_city           TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_state          TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_country        TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_notes          TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at              TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at            TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at              TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key         TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_buyer_idx
  ON orders (buyer_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
