-- Revoke Appeals System SQL
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.revoke_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES public.phases(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'sent', -- can be 'sent', 'seen', 'resolved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.revoke_appeals ENABLE ROW LEVEL SECURITY;

-- Policy: Students can insert their own appeals
CREATE POLICY "Students can insert their own appeals"
ON public.revoke_appeals FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Policy: Students can view their own appeals
CREATE POLICY "Students can view their own appeals"
ON public.revoke_appeals FOR SELECT
USING (auth.uid() = student_id);

-- Policy: Admins have full access
CREATE POLICY "Admins can do everything"
ON public.revoke_appeals FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_revoke_appeals_student_id ON public.revoke_appeals(student_id);
CREATE INDEX IF NOT EXISTS idx_revoke_appeals_status ON public.revoke_appeals(status);
