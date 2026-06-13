-- Add owner role and update Foodra profile
-- Run this SQL in your Supabase database

-- 1. Allow 'owner' as a valid role value in the users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('farmer', 'buyer', 'admin', 'owner'));

-- 2. Update the specific user to be owner role (Foodra's official profile)
UPDATE users 
SET role = 'owner'
WHERE id = '292d7db3-2fd6-4dd2-9fac-d8c3b08b521d';

-- 3. Products already owned by this user remain as-is.
-- Do NOT reassign other farmers' products — each product keeps its original farmer_id.

-- 4. Update any existing orders to reference Foodra as seller
UPDATE order_items 
SET farmer_wallet = (
  SELECT wallet_address 
  FROM users 
  WHERE id = '292d7db3-2fd6-4dd2-9fac-d8c3b08b521d'
)
WHERE farmer_wallet IS NOT NULL;
