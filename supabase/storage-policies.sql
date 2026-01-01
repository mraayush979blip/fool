-- NOTE: If this script fails with permission errors, please create the buckets ('assignment-documents' and 'student-submissions') manually in the Supabase Dashboard -> Storage.

-- 1. assignment-documents BUCKET (Admin Only Uploads, Public Read)
-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-documents', 'assignment-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Cleanup existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Read Assignment Documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins Upload Assignment Documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins Update Assignment Documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins Delete Assignment Documents" ON storage.objects;

-- Policy: Public Read
CREATE POLICY "Public Read Assignment Documents"
ON storage.objects FOR SELECT
USING ( bucket_id = 'assignment-documents' );

-- Policy: Admin Insert
CREATE POLICY "Admins Upload Assignment Documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assignment-documents' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Policy: Admin Update
CREATE POLICY "Admins Update Assignment Documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'assignment-documents' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Policy: Admin Delete
CREATE POLICY "Admins Delete Assignment Documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'assignment-documents' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);


-- 2. student-submissions BUCKET (Student Uploads, Admin/Owner Read)
-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-submissions', 'student-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Cleanup existing policies
DROP POLICY IF EXISTS "Students Upload Own Submissions" ON storage.objects;
DROP POLICY IF EXISTS "Read Own or Admin Submissions" ON storage.objects;
DROP POLICY IF EXISTS "Update Own Submissions" ON storage.objects;
DROP POLICY IF EXISTS "Delete Own Submissions" ON storage.objects;

-- Policy: Student/Authenticated Insert
CREATE POLICY "Students Upload Own Submissions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'student-submissions' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Read (Owner or Admin)
CREATE POLICY "Read Own or Admin Submissions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'student-submissions' AND
  (
    auth.uid() = owner OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
);

-- Policy: Update (Owner or Admin)
CREATE POLICY "Update Own Submissions"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'student-submissions' AND
  (
    auth.uid() = owner OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
);

-- Policy: Delete (Owner or Admin)
CREATE POLICY "Delete Own Submissions"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'student-submissions' AND
  (
    auth.uid() = owner OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
);
