-- TEMPORARY FIX: Disable RLS on users table for testing
-- This will help us identify if RLS policies are blocking the login

-- Disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Verify the user exists
SELECT id, email, name, role, status FROM users WHERE email = 'apk@gmail.com';

-- After you successfully login, you can re-enable RLS with:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
