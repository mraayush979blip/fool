-- Add Web URL submission types and per-assignment types support

-- 1. Add new columns to support per-assignment types and web URLs
ALTER TABLE phases ADD COLUMN IF NOT EXISTS assignment_submission_types JSONB DEFAULT '[]'::jsonb;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS web_url VARCHAR(500);
ALTER TABLE submission_history ADD COLUMN IF NOT EXISTS web_url VARCHAR(500);

-- 2. Update phase allowed_submission_type constraints
ALTER TABLE phases DROP CONSTRAINT IF EXISTS phases_allowed_submission_type_check;
ALTER TABLE phases ADD CONSTRAINT phases_allowed_submission_type_check CHECK (allowed_submission_type IN ('github', 'file', 'both', 'web'));

-- 3. Update submissions submission_type constraints
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_submission_type_check;
ALTER TABLE submissions ADD CONSTRAINT submissions_submission_type_check CHECK (submission_type IN ('github', 'file', 'web'));

-- 4. Update submissions one_submission_type constraint to include web_url
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS one_submission_type;
ALTER TABLE submissions ADD CONSTRAINT one_submission_type CHECK (
    (submission_type = 'github' AND github_url IS NOT NULL AND file_url IS NULL AND web_url IS NULL) OR
    (submission_type = 'file' AND file_url IS NOT NULL AND github_url IS NULL AND web_url IS NULL) OR
    (submission_type = 'web' AND web_url IS NOT NULL AND github_url IS NULL AND file_url IS NULL)
);

-- 5. Add comment for documentation
COMMENT ON COLUMN phases.assignment_submission_types IS 'Array of submission types if total_assignments > 1. e.g. ["github", "web"]';
COMMENT ON COLUMN submissions.web_url IS 'Deployed Web URL for web submission type';
