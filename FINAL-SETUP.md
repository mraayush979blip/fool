# 🚀 Final Setup Steps - Admin Login Fix

## Your Admin Account Details
- **Email**: `apk@gmail.com`
- **User ID**: `0a2c13d9-51b2-4b37-8566-e482d34f49ef`

## Step 1: Run Fix Script in Supabase

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/tclvquwsxbntvwvozeto/editor/sql

2. Copy **ALL** contents from `supabase/fix-admin-user.sql`

3. Paste into SQL Editor and click **Run** (or Ctrl+Enter)

4. Check the results:
   - Should see "Current auth users" with your email
   - Should see "After fix" with your user record
   - Should see "✅ SUCCESS - IDs match!" at the end

## Step 2: Test Login

1. Open http://localhost:3000 in your browser

2. Press **F12** to open Developer Tools → **Console** tab

3. Enter credentials:
   - Email: `apk@gmail.com`
   - Password: (the password you set in Supabase Auth)

4. Click **Sign In**

5. Check the console for these messages:
   ```
   Sign in successful - Auth user: apk@gmail.com
   Sign in - User data: {id: "0a2c13d9...", email: "apk@gmail.com", role: "admin", ...}
   ✅ User set successfully: apk@gmail.com Role: admin
   ```

6. You should be redirected to `/admin` dashboard

## If Still Having Issues

### Check 1: Verify User Exists
Run this in Supabase SQL Editor:
```sql
SELECT id, email, role, status FROM users WHERE email = 'apk@gmail.com';
```

Should return:
```
id: 0a2c13d9-51b2-4b37-8566-e482d34f49ef
email: apk@gmail.com
role: admin
status: active
```

### Check 2: Disable RLS Temporarily
If you see "policy" errors in console, run:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

Then try login again. If it works, the issue is RLS policies.

### Check 3: Browser Console Errors
Look for any red error messages in the browser console and share them.

## Expected Result

After successful login, you should see:
- Admin Dashboard at http://localhost:3000/admin
- KPI cards showing:
  - Total Students: 0
  - Active Students: 0
  - Revoked Students: 0
  - Live Phases: 0
- Your name in the top right corner
- Sign Out button

## Next Steps After Login Works

Once you can login successfully, we can continue building:
- ✅ Phase Management (Create, Edit, Pause phases)
- ✅ Student Management (Import CSV, View, Revoke)
- ✅ Student Portal
- ✅ Video Player with tracking
- ✅ Assignment submission system

---

**Current Status**: Ready to test login!
**Action Required**: Run `fix-admin-user.sql` in Supabase, then test login
