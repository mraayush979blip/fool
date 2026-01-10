-- Migration: Multiple Assignments Support
-- Run this in your Supabase SQL Editor

-- 1. Update phases table to store the required number of assignments
ALTER TABLE phases ADD COLUMN IF NOT EXISTS total_assignments INTEGER DEFAULT 1;

-- 2. Update submissions table to support multiple slots per phase
-- First, add the assignment_index column
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS assignment_index INTEGER DEFAULT 1;

-- 3. Update the unique constraint on submissions
-- We need to drop the old unique constraint (student_id, phase_id) 
-- and replace it with (student_id, phase_id, assignment_index)

-- Find the constraint name (usually submissions_student_id_phase_id_key or similar)
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'submissions'::regclass AND contype = 'u';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE submissions DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

-- Add the new unique constraint
ALTER TABLE submissions ADD CONSTRAINT submissions_student_phase_index_key UNIQUE (student_id, phase_id, assignment_index);

-- 4. Update the submission history table similarly if needed
ALTER TABLE submission_history ADD COLUMN IF NOT EXISTS assignment_index INTEGER DEFAULT 1;
