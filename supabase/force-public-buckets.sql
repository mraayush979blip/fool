-- Force buckets to be public to resolve 400 Bad Request on download
-- This logic updates the 'public' flag to true for existing buckets

UPDATE storage.buckets
SET public = true
WHERE id = 'assignment-documents';

UPDATE storage.buckets
SET public = true
WHERE id = 'student-submissions';

-- Verify the change
SELECT id, name, public FROM storage.buckets WHERE id IN ('assignment-documents', 'student-submissions');
