-- Add min_seconds_required to phases table
ALTER TABLE phases ADD COLUMN IF NOT EXISTS min_seconds_required INTEGER DEFAULT 0;

-- Update existing phases to have a default value if needed (already handled by DEFAULT 0)
COMMENT ON COLUMN phases.min_seconds_required IS 'Minimum time in seconds a student must spend on this phase before they can submit an assignment.';
