# Flexible Assignment Unlock - Migration Guide

## What Changed
Instead of requiring students to complete the full video lecture, admins can now set a **minimum time requirement** (in minutes) for each phase. Students must spend at least that amount of time on the phase page before they can submit their assignment.

## Database Changes
A new column `min_seconds_required` has been added to the `phases` table.

## How to Apply the Migration

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the SQL script located at: `supabase/add-min-time.sql`

### Option 2: Via Command Line
If you have the Supabase CLI installed:
```bash
supabase db push
```

## SQL Migration Script
```sql
-- Add min_seconds_required to phases table
ALTER TABLE phases ADD COLUMN IF NOT EXISTS min_seconds_required INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN phases.min_seconds_required IS 'Minimum time in seconds a student must spend on this phase before they can submit an assignment.';
```

## How It Works

### For Admins:
- When creating or editing a phase, you can set the "Minimum Time Spent (Minutes)"
- Set it to `0` if you want students to submit immediately without any time restriction
- Set it to any positive number (e.g., `30` for 30 minutes) to enforce a minimum engagement time

### For Students:
- Students see a real-time countdown showing how much more time they need to spend
- Once they've spent enough time, the assignment form unlocks automatically
- The UI shows:
  - **Orange badge**: "X min remaining" (when locked)
  - **Green badge**: "Assignment Unlocked" (when unlocked)
  - **Detailed message**: Shows total required time and remaining time

### Example Use Cases:
- **Short Video (5 min)**: Set minimum to `10 minutes` to ensure students watch and review
- **Long Tutorial (45 min)**: Set minimum to `45 minutes` to match video length
- **Quick Assignment**: Set minimum to `0 minutes` for no restriction

## Backward Compatibility
- Existing phases will have `min_seconds_required = 0` by default (no restriction)
- The system still tracks video completion for analytics purposes
- All previous functionality remains intact

## Verification
After applying the migration:
1. Create a new phase with a minimum time requirement (e.g., 2 minutes)
2. As a student, visit that phase
3. Try to submit immediately - should be blocked
4. Wait 2 minutes - assignment should unlock automatically
