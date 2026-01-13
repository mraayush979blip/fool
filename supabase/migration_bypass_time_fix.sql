-- Ensure column exists with safer check (in case previous failed)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phases' AND column_name = 'bypass_time_requirement') THEN
        ALTER TABLE public.phases ADD COLUMN bypass_time_requirement BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Update existing rows to have default FALSE if they act NULL
UPDATE public.phases SET bypass_time_requirement = FALSE WHERE bypass_time_requirement IS NULL;

-- Explicitly notify on the comment
COMMENT ON COLUMN public.phases.bypass_time_requirement IS 'If true, students can submit assignments immediately without waiting for min_time or video completion.';
