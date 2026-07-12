-- 1. إصلاح سياسات الأقسام (Sections)
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sections are viewable by everyone" ON public.sections;
CREATE POLICY "Sections are viewable by everyone" ON public.sections FOR SELECT USING (true);

-- 2. إصلاح سياسات المسارات (Tracks)
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tracks are viewable by everyone" ON public.tracks;
CREATE POLICY "Tracks are viewable by everyone" ON public.tracks FOR SELECT USING (true);

-- 3. تفعيل وإضافة سياسات المهارات (Micro Skills)
ALTER TABLE public.micro_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Micro skills are viewable by everyone" ON public.micro_skills;
CREATE POLICY "Micro skills are viewable by everyone" ON public.micro_skills FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert micro_skills" ON public.micro_skills;
CREATE POLICY "Admins can insert micro_skills" ON public.micro_skills FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Admins can update micro_skills" ON public.micro_skills;
CREATE POLICY "Admins can update micro_skills" ON public.micro_skills FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Admins can delete micro_skills" ON public.micro_skills;
CREATE POLICY "Admins can delete micro_skills" ON public.micro_skills FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
