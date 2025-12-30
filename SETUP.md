# Supabase Setup Guide

## Step 1: Run Database Schema

1. Open your Supabase project: https://supabase.com/dashboard/project/tclvquwsxbntvwvozeto
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/schema.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Verify all tables are created (should see success message)

## Step 2: Create Admin User

### Option A: Using Supabase Dashboard (Recommended)

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click **Add User** → **Create new user**
3. Enter:
   - Email: `admin@example.com` (or your preferred email)
   - Password: Create a strong password
   - Check "Auto Confirm User"
4. Click **Create User**
5. Copy the User ID (UUID) that appears
6. Go to **Table Editor** → **users** table
7. Click **Insert** → **Insert row**
8. Fill in:
   - `id`: Paste the User ID from step 5
   - `email`: Same email as step 3
   - `name`: Your name (e.g., "Admin User")
   - `role`: Select `admin` from dropdown
   - `status`: Select `active` from dropdown
9. Click **Save**

### Option B: Using SQL (Alternative)

Run this SQL in Supabase SQL Editor (replace with your values):

```sql
-- First, create the auth user (this will generate a UUID)
-- You'll need to do this in the Supabase Dashboard under Authentication → Users

-- Then, insert into users table (replace the UUID with the one from auth.users)
INSERT INTO users (id, email, name, role, status)
VALUES (
  'YOUR-USER-UUID-HERE',  -- Replace with UUID from auth.users
  'admin@example.com',     -- Your admin email
  'Admin User',            -- Your name
  'admin',                 -- Role
  'active'                 -- Status
);
```

## Step 3: Verify Setup

1. Restart the dev server (if running):
   ```bash
   # Press Ctrl+C in the terminal running npm run dev
   npm run dev
   ```

2. Open http://localhost:3000
3. You should be redirected to `/login`
4. Enter your admin credentials
5. You should be redirected to `/admin` dashboard
6. Verify KPI cards show correct data

## Troubleshooting

### "Missing Supabase environment variables"
- Check that `.env.local` exists in the project root
- Verify it contains both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart the dev server

### "Invalid login credentials"
- Verify the user exists in Authentication → Users
- Verify the user has a matching entry in the `users` table
- Check that `role` is set to `'admin'`
- Check that `status` is set to `'active'`

### "Cannot read properties of null"
- Verify all tables were created successfully
- Check that RLS policies are enabled
- Verify the user ID matches between `auth.users` and `users` table

### Tables not created
- Make sure you ran the ENTIRE `schema.sql` file
- Check for any SQL errors in the Supabase SQL Editor
- Verify you have permissions to create tables

## Next Steps

Once logged in as admin, you can:
- Create learning phases
- Import students via CSV
- View analytics and retention stats
- Manage student accounts

## Environment Variables

Your current configuration:
```
NEXT_PUBLIC_SUPABASE_URL=https://tclvquwsxbntvwvozeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ Environment file created at: `.env.local`
