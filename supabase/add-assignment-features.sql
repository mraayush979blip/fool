-- Migration: Add Assignment Upload Features
-- This migration adds support for file uploads and submission type selection

-- Add new columns to phases table
ALTER TABLE phases 
ADD COLUMN IF NOT EXISTS assignment_file_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS allowed_submission_type VARCHAR(20) DEFAULT 'both' CHECK (allowed_submission_type IN ('github', 'file', 'both'));

-- Update existing records to have 'both' as default
UPDATE phases 
SET allowed_submission_type = 'both' 
WHERE allowed_submission_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN phases.assignment_file_url IS 'URL to assignment document stored in Supabase Storage';
COMMENT ON COLUMN phases.allowed_submission_type IS 'Allowed submission method: github, file, or both';

-- Create storage bucket for assignment documents (run this separately in Supabase dashboard or via API)
-- Bucket name: assignment-documents
-- Public access: true (students need to download)
-- File size limit: 2MB
-- Allowed file types: application/pdf, image/jpeg, image/png

-- Storage policies will be created via Supabase Dashboard or programmatically
