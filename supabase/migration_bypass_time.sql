-- Add bypass_time_requirement column to phases table
ALTER TABLE public.phases 
ADD COLUMN IF NOT EXISTS bypass_time_requirement BOOLEAN DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN public.phases.bypass_time_requirement IS 'If true, students can submit assignments immediately without waiting for min_time or video completion.';

-- Update RLS policies (optional, if you have specific policies on column access, but usually public read is fine for phases)
