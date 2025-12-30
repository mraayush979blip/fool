-- QUICK FIX: Ensure admin user exists in users table
-- This will insert or update the user record

-- First, let's see what we have
SELECT 'Current auth users:' as info;
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'apk@gmail.com';

SELECT 'Current users table:' as info;
SELECT id, email, name, role, status FROM users WHERE email = 'apk@gmail.com';

-- Now insert or update the admin user
-- This uses UPSERT (INSERT ... ON CONFLICT ... DO UPDATE)
INSERT INTO users (id, email, name, role, status, created_at, updated_at)
VALUES (
  '0a2c13d9-51b2-4b37-8566-e482d34f49ef',
  'apk@gmail.com',
  'Admin User',
  'admin',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = 'admin',
  status = 'active',
  updated_at = NOW();

-- Also try by email in case ID is different
INSERT INTO users (id, email, name, role, status, created_at, updated_at)
SELECT 
  id,
  email,
  'Admin User',
  'admin',
  'active',
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'apk@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  status = 'active',
  updated_at = NOW();

-- Verify it worked
SELECT 'After fix:' as info;
SELECT id, email, name, role, status FROM users WHERE email = 'apk@gmail.com';

-- Check if IDs match
SELECT 
  CASE 
    WHEN au.id = u.id THEN '✅ SUCCESS - IDs match!'
    ELSE '❌ PROBLEM - IDs do not match'
  END as result,
  au.id as auth_id,
  u.id as users_id,
  u.role,
  u.status
FROM auth.users au
JOIN users u ON au.email = u.email
WHERE au.email = 'apk@gmail.com';
