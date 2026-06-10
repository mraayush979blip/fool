-- ==========================================
-- ALL-IN-ONE FIX FOR PHASES SCHEMA & RLS
-- ==========================================

-- 1. Ensure Columns Exist
ALTER TABLE "public"."phases" 
ADD COLUMN IF NOT EXISTS "has_multiple_options" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "options" jsonb;

-- 2. Make sure RLS is enabled
ALTER TABLE "public"."phases" ENABLE ROW LEVEL SECURITY;

-- 3. Drop all existing policies on phases to clean slate
DROP POLICY IF EXISTS "everyone_see_active_phases" ON "public"."phases";
DROP POLICY IF EXISTS "admins_manage_phases" ON "public"."phases";
DROP POLICY IF EXISTS "admins_all_phases" ON "public"."phases";
DROP POLICY IF EXISTS "public_read_phases" ON "public"."phases";
DROP POLICY IF EXISTS "admin_all_phases" ON "public"."phases";

-- 4. Create robust RLS policies

-- Everyone can view active phases
CREATE POLICY "public_read_phases" 
ON "public"."phases" FOR SELECT 
USING (is_active = true);

-- Admins get full CRUD access to all phases
CREATE POLICY "admin_all_phases" 
ON "public"."phases" FOR ALL 
USING (
  (SELECT role FROM "public"."users" WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM "public"."users" WHERE id = auth.uid()) = 'admin'
);

-- 5. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
