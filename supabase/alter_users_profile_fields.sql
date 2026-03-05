ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'buyer';

ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check CHECK (role IN ('farmer', 'buyer', 'admin'));
