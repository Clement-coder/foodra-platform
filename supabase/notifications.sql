-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'order', 'funding', 'training', 'support', 'broadcast', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- optional deep link e.g. /orders/123
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );

-- Service role (admin API) can do everything — handled via supabase admin client, no RLS needed for service role

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
