-- Order tracking: add estimated delivery date and tracking notes
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS estimated_delivery_date date,
  ADD COLUMN IF NOT EXISTS tracking_notes text,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Auto-set shipped_at when status changes to Shipped
CREATE OR REPLACE FUNCTION set_order_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Shipped' AND OLD.status != 'Shipped' THEN
    NEW.shipped_at = NOW();
  END IF;
  IF NEW.status = 'Delivered' AND OLD.status != 'Delivered' THEN
    NEW.delivered_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_timestamp_trigger ON orders;
CREATE TRIGGER order_timestamp_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_order_timestamps();
