-- Diagnostic Query: Check Auth and Users Table Sync
-- Run this to see if there's a mismatch

-- 1. Check if user exists in auth.users
SELECT 
  'AUTH USER' as source,
  id, 
  email, 
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'apk@gmail.com';

-- 2. Check if user exists in users table
SELECT 
  'USERS TABLE' as source,
  id, 
  email, 
  name,
  role,
  status,
  created_at
FROM users 
WHERE email = 'apk@gmail.com';

-- 3. Check if IDs match
SELECT 
  CASE 
    WHEN au.id = u.id THEN '✅ IDs MATCH'
    WHEN au.id IS NULL THEN '❌ NO AUTH USER'
    WHEN u.id IS NULL THEN '❌ NO USERS TABLE ENTRY'
    ELSE '❌ ID MISMATCH'
  END as status,
  au.id as auth_id,
  u.id as users_table_id,
  au.email as auth_email,
  u.email as users_email,
  u.role,
  u.status
FROM auth.users au
FULL OUTER JOIN users u ON au.id = u.id
WHERE au.email = 'apk@gmail.com' OR u.email = 'apk@gmail.com';
