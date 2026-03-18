# Task: Fix Admin Login Disruption

## Problem Statement
The admin is unable to log in, likely due to a mismatch between Supabase Auth and the `public.users` profile table, or a `revoked` status assigned during a database sync.

## Root Cause Analysis
1.  **ID Mismatch**: Multiple SQL scripts (`fix-admin-user.sql`, `ULTIMATE-RLS-FIX.sql`) used different hardcoded UUIDs.
2.  **Missing Profile**: If the record in `public.users` is missing, `AuthContext` fails to set the `user` state.
3.  **RLS Blocking**: Potential recursive RLS policies or restrictive read access on the `users` table.

## Implementation Plan

### Phase 1: Database Correction
- [ ] Create `supabase/FIX_ADMIN_ACCESS_FINAL.sql`
    - [ ] Dynamically fetch the current ID for `apk@gmail.com` (and others).
    - [ ] Sync/Insert into `public.users` with `role = 'admin'` and `status = 'active'`.
    - [ ] Re-apply the robust `is_admin()` helper function.
    - [ ] Fix RLS policies to allow self-selection and admin access.

### Phase 2: Verification
- [ ] Instruct user to run the SQL script.
- [ ] Instruct user to use "Reset Core Buffer" on the login page.
- [ ] Verify login redirection to `/admin`.

## Verification Criteria
- [ ] Admin successfully logs in.
- [ ] Admin is redirected to `/admin` dashboard.
- [ ] Admin can see dashboard stats (proving RLS is fixed).
