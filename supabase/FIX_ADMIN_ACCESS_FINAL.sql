/*
  🚨 ULTIMATE ADMIN ACCESS FIX: RUN IN SUPABASE SQL EDITOR 🚨
  -------------------------------------------------------------
  This script will:
  1. Identify any existing auth.users by email (like apk@gmail.com).
  2. Ensure they exist in the public.users profile table.
  3. Force their role to 'admin' and status to 'active'.
  4. Fix RLS policies to allow admins to see their own profiles reliably.
*/

-- 1. DISABLE RLS TEMPORARILY
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. RESET ROLES & STATUS FOR COMMON ADMIN EMAILS
-- (Modify these if you're using a different admin email)
DO $$
DECLARE
    admin_record RECORD;
BEGIN
    FOR admin_record IN 
        SELECT id, email, COALESCE(raw_user_meta_data->>'name', 'Administrator') as name 
        FROM auth.users 
        WHERE email IN ('apk@gmail.com', 'admin@example.com')
    LOOP
        -- Insert or Update the profile
        INSERT INTO public.users (id, email, name, role, status)
        VALUES (admin_record.id, admin_record.email, admin_record.name, 'admin', 'active')
        ON CONFLICT (id) DO UPDATE SET
            role = 'admin',
            status = 'active',
            updated_at = NOW();
            
        RAISE NOTICE '✅ Verified Admin: % (ID: %)', admin_record.email, admin_record.id;
    END LOOP;
END $$;

-- 3. HARDEN is_admin() FUNCTION
-- This needs to be extremely robust to avoid recursion issues.
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

-- 4. RE-ENABLE & FIX RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop all old policies to avoid conflicts
DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.users';
    END LOOP;
END $$;

-- Policy 1: Everyone can see their own profile
CREATE POLICY "users_self_select" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- Policy 2: Everyone can update their own theme (needed for auth context)
CREATE POLICY "users_self_update_theme" 
ON public.users FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Admins can do everything (Full control)
CREATE POLICY "users_admin_all" 
ON public.users FOR ALL 
USING (public.is_admin());

-- 5. VERIFY SYSTEM STATE
SELECT id, email, role, status FROM public.users WHERE role = 'admin';
