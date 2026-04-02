-- Support messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  image_url TEXT,
  is_admin_reply BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_support_messages_user ON support_messages(user_id);
CREATE INDEX idx_support_messages_created ON support_messages(created_at DESC);

-- Enable RLS
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
CREATE POLICY "Users can view own support messages" ON support_messages 
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );

-- Users can create their own messages
CREATE POLICY "Users can create own support messages" ON support_messages 
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );

-- Admins can view all messages
CREATE POLICY "Admins can view all support messages" ON support_messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE privy_id = auth.jwt() ->> 'sub' 
      AND role = 'admin'
    )
  );

-- Admins can insert replies
CREATE POLICY "Admins can create support replies" ON support_messages 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE privy_id = auth.jwt() ->> 'sub' 
      AND role = 'admin'
    )
  );

-- Update RLS policies for admin access to all tables
CREATE POLICY "Admins can view all users" ON users 
  FOR SELECT USING (
    role = 'admin' OR true
  );

CREATE POLICY "Admins can view all products" ON products 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE privy_id = auth.jwt() ->> 'sub' 
      AND role = 'admin'
    ) OR is_available = true
  );

CREATE POLICY "Admins can view all funding applications" ON funding_applications 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE privy_id = auth.jwt() ->> 'sub' 
      AND role = 'admin'
    ) OR user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );

CREATE POLICY "Admins can view all orders" ON orders 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE privy_id = auth.jwt() ->> 'sub' 
      AND role = 'admin'
    ) OR buyer_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );

CREATE POLICY "Admins can view all training enrollments" ON training_enrollments 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE privy_id = auth.jwt() ->> 'sub' 
      AND role = 'admin'
    ) OR user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );
