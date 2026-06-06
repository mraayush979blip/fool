CREATE POLICY "Students can view their own extensions"
ON public.phase_extensions FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all extensions"
ON public.phase_extensions FOR SELECT
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
