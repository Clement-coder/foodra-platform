-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (privy_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (privy_id = auth.jwt() ->> 'sub');

-- Products policies
CREATE POLICY "Anyone can view available products" ON products FOR SELECT USING (is_available = true);
CREATE POLICY "Farmers can insert own products" ON products FOR INSERT WITH CHECK (
  farmer_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);
CREATE POLICY "Farmers can update own products" ON products FOR UPDATE USING (
  farmer_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);
CREATE POLICY "Farmers can delete own products" ON products FOR DELETE USING (
  farmer_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);

-- Trainings policies
CREATE POLICY "Anyone can view trainings" ON trainings FOR SELECT USING (true);
CREATE POLICY "Admins can manage trainings" ON trainings FOR ALL USING (true);

-- Training enrollments policies
CREATE POLICY "Users can view own enrollments" ON training_enrollments FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);
CREATE POLICY "Users can create own enrollments" ON training_enrollments FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);

-- Funding applications policies
CREATE POLICY "Users can view own applications" ON funding_applications FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);
CREATE POLICY "Users can create own applications" ON funding_applications FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (
  buyer_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (
  buyer_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);

-- Order items policies
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  order_id IN (
    SELECT id FROM orders WHERE buyer_id IN (
      SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub'
    )
  )
);
CREATE POLICY "Users can create order items" ON order_items FOR INSERT WITH CHECK (
  order_id IN (
    SELECT id FROM orders WHERE buyer_id IN (
      SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub'
    )
  )
);
