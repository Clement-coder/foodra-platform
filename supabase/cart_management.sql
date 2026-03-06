-- Cart Items Table
-- Stores cart items for each user with product availability tracking

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Function to get available quantity for a product
CREATE OR REPLACE FUNCTION get_available_quantity(p_product_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_quantity INTEGER;
  reserved_quantity INTEGER;
BEGIN
  -- Get total quantity from products table
  SELECT quantity INTO total_quantity
  FROM products
  WHERE id = p_product_id;
  
  -- Get total quantity in all carts
  SELECT COALESCE(SUM(quantity), 0) INTO reserved_quantity
  FROM cart_items
  WHERE product_id = p_product_id;
  
  -- Return available quantity
  RETURN GREATEST(total_quantity - reserved_quantity, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to validate cart item before insert/update
CREATE OR REPLACE FUNCTION validate_cart_item()
RETURNS TRIGGER AS $$
DECLARE
  available_qty INTEGER;
  current_cart_qty INTEGER;
BEGIN
  -- Get current quantity in user's cart (excluding this item if updating)
  IF TG_OP = 'UPDATE' THEN
    SELECT COALESCE(SUM(quantity), 0) INTO current_cart_qty
    FROM cart_items
    WHERE product_id = NEW.product_id AND user_id != NEW.user_id;
  ELSE
    SELECT COALESCE(SUM(quantity), 0) INTO current_cart_qty
    FROM cart_items
    WHERE product_id = NEW.product_id;
  END IF;
  
  -- Get product total quantity
  SELECT quantity INTO available_qty
  FROM products
  WHERE id = NEW.product_id;
  
  -- Check if requested quantity is available
  IF (current_cart_qty + NEW.quantity) > available_qty THEN
    RAISE EXCEPTION 'Not enough stock available. Available: %, Requested: %', 
      (available_qty - current_cart_qty), NEW.quantity;
  END IF;
  
  -- Prevent users from adding their own products to cart
  IF EXISTS (
    SELECT 1 FROM products 
    WHERE id = NEW.product_id AND farmer_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Cannot add your own product to cart';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate cart items
DROP TRIGGER IF EXISTS validate_cart_item_trigger ON cart_items;
CREATE TRIGGER validate_cart_item_trigger
  BEFORE INSERT OR UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_cart_item();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cart_item_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp
DROP TRIGGER IF EXISTS update_cart_item_timestamp_trigger ON cart_items;
CREATE TRIGGER update_cart_item_timestamp_trigger
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_item_timestamp();

-- RLS Policies for cart_items
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Users can only see their own cart items
CREATE POLICY "Users can view own cart items" ON cart_items
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can insert their own cart items
CREATE POLICY "Users can insert own cart items" ON cart_items
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can update their own cart items
CREATE POLICY "Users can update own cart items" ON cart_items
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can delete their own cart items
CREATE POLICY "Users can delete own cart items" ON cart_items
  FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
