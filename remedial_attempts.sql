-- Create remedial_attempts table
CREATE TABLE IF NOT EXISTS public.remedial_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES public.micro_skills(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.remedial_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select their own remedial attempts
CREATE POLICY "Users can view their own remedial attempts"
    ON public.remedial_attempts FOR SELECT
    USING (auth.uid() = student_id);

-- Create policy for admins/service role
CREATE POLICY "Admins can manage remedial attempts"
    ON public.remedial_attempts FOR ALL
    USING (
      auth.jwt() ->> 'role' = 'service_role' OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
      auth.jwt() ->> 'role' = 'service_role' OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
