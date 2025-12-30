# 🔧 Login Issue Troubleshooting

## Problem
You're being redirected back to the login page after entering credentials.

## Diagnosis Steps

### Step 1: Check Browser Console
1. Open http://localhost:3000
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Try to login again
5. Look for these messages:
   - `Sign in successful - Auth user: apk@example.com`
   - `Sign in - User data: ...`
   - `Sign in - Error: ...`

### Step 2: Run Diagnostic SQL
1. Open Supabase SQL Editor
2. Run the file: `supabase/debug-auth.sql`
3. Check the results:
   - ✅ Should see user in both `auth.users` and `users` table
   - ✅ IDs should match
   - ❌ If "NO USERS TABLE ENTRY" → Run fix script

### Step 3: Run Fix Script
1. Open Supabase SQL Editor
2. Run the file: `supabase/fix-admin-user.sql`
3. This will:
   - Show current state
   - Insert/update user record
   - Verify the fix

## Common Issues & Solutions

### Issue 1: "User not found in users table"
**Cause**: The `create-admin.sql` script wasn't run or failed

**Fix**: Run `supabase/fix-admin-user.sql` in Supabase SQL Editor

### Issue 2: "Row Level Security policy violation"
**Cause**: RLS policies are blocking the query

**Fix**: Run this SQL to temporarily disable RLS for testing:
```sql
-- Disable RLS on users table (TEMPORARY - for testing only)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

Then try logging in. If it works, the issue is RLS policies.

To re-enable RLS after testing:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### Issue 3: ID Mismatch
**Cause**: The UUID in `create-admin.sql` doesn't match the auth user

**Fix**: 
1. Get the correct UUID:
```sql
SELECT id FROM auth.users WHERE email = 'apk@example.com';
```

2. Update the users table:
```sql
UPDATE users 
SET id = (SELECT id FROM auth.users WHERE email = 'apk@example.com')
WHERE email = 'apk@example.com';
```

## Quick Test

After running the fix, test with this SQL:
```sql
-- This should return exactly 1 row with matching IDs
SELECT 
  au.id as auth_id,
  u.id as users_id,
  au.email,
  u.role,
  u.status,
  CASE WHEN au.id = u.id THEN '✅ MATCH' ELSE '❌ MISMATCH' END as status
FROM auth.users au
JOIN users u ON au.email = u.email
WHERE au.email = 'apk@example.com';
```

Expected result:
```
auth_id: 0a2c13d9-51b2-4b37-8566-e482d34f49ef
users_id: 0a2c13d9-51b2-4b37-8566-e482d34f49ef
email: apk@example.com
role: admin
status: active
status: ✅ MATCH
```

## Next Steps

1. **Run fix-admin-user.sql** in Supabase
2. **Check browser console** for error messages
3. **Try login again** at http://localhost:3000
4. **Report back** what you see in the console

The console logs will tell us exactly what's failing!
