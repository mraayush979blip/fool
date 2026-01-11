-- ==========================================
-- ULTIMATE RLS FIX & RESET
-- ==========================================
-- This script nukes all existing RLS policies on the 'users' table
-- and recreates them using a guaranteed non-recursive method.

-- 1. DISABLE RLS TEMPORARILY TO CLEAR STATE
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. DROP ALL POSSIBLE POLICIES (even if they have different names)
DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.users';
    END LOOP;
END $$;

-- 3. RE-IMPLEMENT ADMIN CHECK 
-- Using a dedicated function that is guaranteed to bypass RLS
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (role = 'admin')
    FROM public.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. ENABLE RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. CREATE CLEAN, NON-RECURSIVE POLICIES
-- Policy 1: Everyone can see their own profile
CREATE POLICY "users_self_select" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- Policy 2: Admins can do everything
-- Crucial: This calls is_admin() which runs as SECURITY DEFINER (bypassing RLS)
CREATE POLICY "users_admin_all" 
ON public.users FOR ALL 
USING (public.is_admin());

-- 6. FIX OTHER TABLES (just in case)
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins_manage_phases" ON public.phases;
CREATE POLICY "admins_manage_phases" ON public.phases 
FOR ALL USING (public.is_admin());

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins_see_all_submissions" ON public.submissions;
CREATE POLICY "admins_see_all_submissions" ON public.submissions
FOR SELECT USING (public.is_admin());

-- 7. ENSURE ADMIN ROW EXISTS 
-- (If you ran create-admin.sql, this might already be there, but let's be sure)
-- NOTE: Replace the ID below with your actual Supabase Auth ID if it differs
-- This is just a safety update for the specific ID shown in your logs
UPDATE public.users 
SET role = 'admin', status = 'active' 
WHERE id = '4d370d7a-8a9e-4017-ade4-6f7ea8a327f1';

-- Success message
DO $$ BEGIN
  RAISE NOTICE 'ULTIMATE RLS FIX APPLIED. Please refresh your browser.';
END $$;
