-- AI Credit Score cache on funding applications
ALTER TABLE funding_applications
  ADD COLUMN IF NOT EXISTS credit_score integer,
  ADD COLUMN IF NOT EXISTS credit_tier text,
  ADD COLUMN IF NOT EXISTS credit_recommendation text,
  ADD COLUMN IF NOT EXISTS credit_scored_at timestamptz;

-- Index for fast admin queries by score
CREATE INDEX IF NOT EXISTS idx_funding_credit_score ON funding_applications(credit_score DESC);
