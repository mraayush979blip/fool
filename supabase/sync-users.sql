-- RUN THIS IN SUPABASE SQL EDITOR
-- This script synchronizes your Supabase Auth accounts with the public.users table.
-- Use this if you can't log in despite having a correct email/password.

-- 1. Ensure the admin user exists in the users table
-- Replace the email below if your admin email is different
INSERT INTO users (id, email, name, role, status, created_at, updated_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'name', 'Administrator'), 
  'admin', 
  'active', 
  created_at, 
  updated_at
FROM auth.users 
WHERE email = 'apk@gmail.com' -- Change this to your admin email
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  status = 'active',
  updated_at = NOW();

-- 2. Sync any other existing Auth users (like students) into the users table
-- This helps if some imports were partially successful or manually created
INSERT INTO users (id, email, name, role, status, created_at, updated_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'name', 'Student User'), 
  COALESCE(raw_user_meta_data->>'role', 'student'), 
  'active', 
  created_at, 
  updated_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3. Verify the sync results
SELECT email, role, status, created_at 
FROM users 
ORDER BY role ASC, created_at DESC;
