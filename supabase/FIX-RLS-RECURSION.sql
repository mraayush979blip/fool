-- FIX FOR RLS RECURSION ON USERS TABLE
-- Run this in your Supabase SQL Editor

-- 1. Create a helper function with SECURITY DEFINER to bypass RLS for role checks
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (role = 'admin')
    FROM public.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "admins_see_all_users" ON public.users;

-- 3. Create a new non-recursive policy
CREATE POLICY "admins_see_all_users" ON public.users
FOR ALL USING (
  public.check_is_admin()
);

-- 4. Do the same for other policies on users table if they exist
DROP POLICY IF EXISTS "admins_manage_phases" ON public.phases;
CREATE POLICY "admins_manage_phases" ON public.phases
FOR ALL USING (
  public.check_is_admin()
);

DROP POLICY IF EXISTS "admins_see_all_submissions" ON public.submissions;
CREATE POLICY "admins_see_all_submissions" ON public.submissions
FOR SELECT USING (
  public.check_is_admin()
);

-- Success message
DO $$ BEGIN
  RAISE NOTICE 'RLS recursion fix applied successfully!';
END $$;
