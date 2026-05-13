-- membership.sql
-- Adds membership_tier and membership_score columns to users table
-- Tier is auto-computed by a DB function and updated via trigger or API

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS membership_tier TEXT DEFAULT 'Seed',
  ADD COLUMN IF NOT EXISTS membership_score INTEGER DEFAULT 0;

-- Function to compute membership score for a user
CREATE OR REPLACE FUNCTION compute_membership_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_user RECORD;
  v_orders_count INTEGER;
  v_disputes_count INTEGER;
  v_weeks_old INTEGER;
  v_score INTEGER := 0;
BEGIN
  SELECT * INTO v_user FROM users WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Profile complete (name + phone + location + avatar) = 20pts
  IF v_user.name IS NOT NULL AND v_user.phone IS NOT NULL
     AND v_user.location IS NOT NULL AND v_user.avatar_url IS NOT NULL THEN
    v_score := v_score + 20;
  END IF;

  -- Account age: 2pts/week, max 20pts
  v_weeks_old := EXTRACT(EPOCH FROM (NOW() - v_user.created_at)) / 604800;
  v_score := v_score + LEAST(v_weeks_old * 2, 20);

  -- Orders: 5pts each, max 30pts
  SELECT COUNT(*) INTO v_orders_count FROM orders WHERE buyer_id = p_user_id;
  v_score := v_score + LEAST(v_orders_count * 5, 30);

  -- No disputes: 20pts
  SELECT COUNT(*) INTO v_disputes_count FROM order_disputes WHERE user_id = p_user_id;
  IF v_disputes_count = 0 THEN
    v_score := v_score + 20;
  END IF;

  -- Already verified: 10pts
  IF v_user.is_verified THEN
    v_score := v_score + 10;
  END IF;

  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to derive tier from score
CREATE OR REPLACE FUNCTION score_to_tier(p_score INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF p_score >= 80 THEN RETURN 'Champion';
  ELSIF p_score >= 60 THEN RETURN 'Harvester';
  ELSIF p_score >= 40 THEN RETURN 'Grower';
  ELSIF p_score >= 20 THEN RETURN 'Sprout';
  ELSE RETURN 'Seed';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh a user's membership and auto-verify at Champion
CREATE OR REPLACE FUNCTION refresh_user_membership(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_score INTEGER;
  v_tier TEXT;
BEGIN
  v_score := compute_membership_score(p_user_id);
  v_tier  := score_to_tier(v_score);

  UPDATE users
  SET
    membership_score = v_score,
    membership_tier  = v_tier,
    -- Auto-verify when Champion is reached
    is_verified = CASE WHEN v_score >= 80 THEN TRUE ELSE is_verified END
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger: refresh membership when an order is placed
CREATE OR REPLACE FUNCTION trg_order_membership()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_user_membership(NEW.buyer_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_order_insert_membership ON orders;
CREATE TRIGGER after_order_insert_membership
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION trg_order_membership();

-- Trigger: refresh membership when user profile is updated
CREATE OR REPLACE FUNCTION trg_user_membership()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_user_membership(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_user_update_membership ON users;
CREATE TRIGGER after_user_update_membership
  AFTER UPDATE OF name, phone, location, avatar_url ON users
  FOR EACH ROW EXECUTE FUNCTION trg_user_membership();
