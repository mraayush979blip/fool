-- Quick Setup: Create Admin User
-- Run this AFTER you've created a user in Supabase Authentication

-- Step 1: First, go to Supabase Dashboard → Authentication → Users
-- Step 2: Click "Add User" and create a user with email/password
-- Step 3: Copy the User ID (UUID) from the created user
-- Step 4: Replace 'YOUR-USER-UUID-HERE' below with that UUID
-- Step 5: Run this SQL

-- Insert admin user into users table
INSERT INTO users (id, email, name, role, status)
VALUES (
  'YOUR-USER-UUID-HERE',  -- ⚠️ REPLACE THIS with the UUID from auth.users
  'admin@example.com',     -- Your admin email (must match auth user)
  'Admin User',            -- Your name
  'admin',                 -- Role (admin or student)
  'active'                 -- Status (active or revoked)
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  status = 'active';

-- Verify the user was created
SELECT id, email, name, role, status FROM users WHERE role = 'admin';
