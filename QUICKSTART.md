# Quick Setup Instructions

## ✅ Step 1: Run Safe Database Schema

The `users` table already exists, so use the safe schema:

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/tclvquwsxbntvwvozeto/editor/sql
2. Copy ALL contents from `supabase/schema-safe.sql`
3. Paste into SQL Editor
4. Click **Run** (or Ctrl+Enter)
5. Should complete without errors

## ✅ Step 2: Create Admin User

### Option A: Using Supabase Dashboard (Easiest)

1. **Create Auth User**:
   - Go to: https://supabase.com/dashboard/project/tclvquwsxbntvwvozeto/auth/users
   - Click **"Add User"** → **"Create new user"**
   - Email: `admin@example.com` (or your email)
   - Password: Create a strong password (save it!)
   - ✅ Check **"Auto Confirm User"**
   - Click **"Create User"**
   - **COPY THE USER ID** (long UUID like `a1b2c3d4-...`)

2. **Add to Users Table**:
   - Go to SQL Editor
   - Open `supabase/create-admin.sql`
   - Replace `'YOUR-USER-UUID-HERE'` with the UUID you copied
   - Replace email with your actual email
   - Run the SQL
   - Should see: "INSERT 0 1" or "UPDATE 1"

### Option B: Check Existing Users

If you already have users in the auth system, run this to see them:

```sql
-- See all auth users
SELECT id, email, created_at FROM auth.users;

-- See all users in users table
SELECT id, email, name, role, status FROM users;
```

Then update an existing user to admin:

```sql
-- Replace with actual user ID
UPDATE users 
SET role = 'admin', status = 'active' 
WHERE id = 'YOUR-USER-UUID';
```

## ✅ Step 3: Test Login

1. Make sure dev server is running:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. You'll be redirected to `/login`

4. Enter your admin credentials

5. Should redirect to `/admin` dashboard

6. You should see:
   - Total Students: 0 (or actual count)
   - Active Students: 0
   - Revoked Students: 0
   - Live Phases: 0

## Troubleshooting

### "Invalid login credentials"
- Verify user exists in Authentication → Users
- Check email/password are correct
- Verify user is confirmed (not pending)

### "User not found" or blank dashboard
- Run this to check if user is in users table:
  ```sql
  SELECT * FROM users WHERE email = 'your-email@example.com';
  ```
- If empty, run the create-admin.sql script

### Still having issues?
Run this diagnostic query:

```sql
-- Check auth users
SELECT 'AUTH USERS:' as type, id, email FROM auth.users
UNION ALL
-- Check users table
SELECT 'USERS TABLE:' as type, id, email FROM users;
```

This will show if there's a mismatch between auth.users and users table.

---

## Current Status

✅ Environment variables configured
✅ Database schema ready to run
⏳ Waiting for you to:
  1. Run `schema-safe.sql` in Supabase
  2. Create admin user
  3. Test login

Once complete, you can start using the admin dashboard!
