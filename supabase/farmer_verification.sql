-- Farmer verification requests table
CREATE TABLE IF NOT EXISTS verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id_type text NOT NULL,           -- NIN, BVN, Passport, Driver's License
  id_number text NOT NULL,
  farm_address text NOT NULL,
  farm_size numeric NOT NULL,
  status text NOT NULL DEFAULT 'Pending', -- Pending, Approved, Rejected
  admin_note text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_verification_status ON verification_requests(status);

-- Add verified column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
