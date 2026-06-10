-- Add columns for multiple assignment options in phases
ALTER TABLE "public"."phases" 
ADD COLUMN IF NOT EXISTS "has_multiple_options" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "options" jsonb;

-- Reload the PostgREST schema cache so the API recognizes the new columns immediately
NOTIFY pgrst, 'reload schema';
