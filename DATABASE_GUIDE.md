# Supabase Database Setup Guide

To create an exact copy of the database, follow these steps in order.

## 1. Run the Consolidated Script
1.  Go to your **Supabase Dashboard**.
2.  Open the **SQL Editor**.
3.  Click **"New Query"**.
4.  Copy the entire content of [CONSOLIDATED_SETUP.sql](file:///d:/aprilfool/supabase/CONSOLIDATED_SETUP.sql) and paste it into the editor.
5.  Click **Run**.

This script will set up:
- Core tables (users, phases, submissions, activity logs, etc.)
- Gamification tables (badges, inventory, streaks, challenges)
- All RPC functions (revocation, restoration, point awarding, etc.)
- Row Level Security (RLS) policies
- Storage bucket registrations

## 2. Setup Storage Buckets
While the script registers the buckets, you should verify them in the **Storage** section:
1.  **assignment-documents**: Should be **Public**.
2.  **student-submissions**: Should be **Public** (or private with the provided RLS policies if you prefer higher security).

## 3. Create your Admin User
Once the database is ready, you need to create your first administrator account:
1.  Go to **Authentication** -> **Users**.
2.  Click **Add User** -> **Create new user**.
3.  Enter your email and password.
4.  Once created, copy the **User ID (UUID)**.
5.  Go back to the **SQL Editor** and run the following (replacing the ID and email):

```sql
INSERT INTO public.users (id, email, name, role, status)
VALUES (
  'YOUR_OAUTH_OR_AUTH_ID_HERE', 
  'your@email.com', 
  'Administrator', 
  'admin', 
  'active'
) ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'active';
```

## 4. Environment Variables
Ensure your frontend `.env.local` is updated with the new Supabase URL and Anon Key from the **Project Settings** -> **API**.

```env
NEXT_PUBLIC_SUPABASE_URL=your-new-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
```
