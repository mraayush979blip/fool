-- ==========================================
-- FIX FOR STORAGE BUCKETS (FILE UPLOADS)
-- ==========================================

-- 1. Ensure the required storage buckets exist and are public
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('assignment-documents', 'assignment-documents', true),
  ('student-submissions', 'student-submissions', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Clean slate for all storage policies related to these buckets
DROP POLICY IF EXISTS "Public View Assignment Documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins Manage Assignment Documents" ON storage.objects;
DROP POLICY IF EXISTS "Public View Student Submissions" ON storage.objects;
DROP POLICY IF EXISTS "Students Insert Submissions" ON storage.objects;
DROP POLICY IF EXISTS "Students Update Submissions" ON storage.objects;
DROP POLICY IF EXISTS "Admins Manage All Storage" ON storage.objects;

-- 3. Create robust policies for Admin Storage (Assignment Documents)
CREATE POLICY "Public View Assignment Documents" ON storage.objects
FOR SELECT USING (bucket_id = 'assignment-documents');

CREATE POLICY "Admins Manage Assignment Documents" ON storage.objects
FOR ALL USING (
    bucket_id = 'assignment-documents' AND
    (SELECT role FROM "public"."users" WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
    bucket_id = 'assignment-documents' AND
    (SELECT role FROM "public"."users" WHERE id = auth.uid()) = 'admin'
);

-- 4. Create robust policies for Student Submissions
CREATE POLICY "Public View Student Submissions" ON storage.objects
FOR SELECT USING (bucket_id = 'student-submissions');

CREATE POLICY "Students Insert Submissions" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'student-submissions' AND
    auth.uid() IS NOT NULL
);

CREATE POLICY "Students Update Submissions" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'student-submissions' AND
    auth.uid() = owner
);

-- Ensure admins can manage everything in storage (Fallback safety net)
CREATE POLICY "Admins Manage All Storage" ON storage.objects
FOR ALL USING (
    (SELECT role FROM "public"."users" WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
    (SELECT role FROM "public"."users" WHERE id = auth.uid()) = 'admin'
);
