-- Quick check: Does the user exist in the users table?
SELECT 
  'Users table check:' as info,
  id, 
  email, 
  name, 
  role, 
  status,
  created_at
FROM users 
WHERE email = 'apk@gmail.com';

-- If the above returns no rows, run this:
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
  role = 'admin',
  status = 'active',
  updated_at = NOW();

-- Verify
SELECT 
  '✅ After insert:' as info,
  id, 
  email, 
  name, 
  role, 
  status
FROM users 
WHERE email = 'apk@gmail.com';
