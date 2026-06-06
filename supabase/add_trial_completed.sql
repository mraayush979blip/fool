-- Run this in the Supabase SQL Editor to support the TrialModal logic
ALTER TABLE public.users 
ADD COLUMN trial_completed BOOLEAN DEFAULT false;
