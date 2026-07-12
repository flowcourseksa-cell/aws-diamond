-- تفعيل سياسات الأمان على جداول التقدم الخاصة بالطالب

-- 1. جدول تقدم المهارات (skill_progress)
ALTER TABLE public.skill_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own skill progress" ON public.skill_progress;
CREATE POLICY "Users can view own skill progress" ON public.skill_progress FOR SELECT USING (auth.uid() = student_id);
DROP POLICY IF EXISTS "Users can update own skill progress" ON public.skill_progress;
CREATE POLICY "Users can update own skill progress" ON public.skill_progress FOR ALL USING (auth.uid() = student_id);

-- 2. جدول تقدم الدروس (lesson_progress)
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can view own lesson progress" ON public.lesson_progress FOR SELECT USING (auth.uid() = student_id);
DROP POLICY IF EXISTS "Users can update own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can update own lesson progress" ON public.lesson_progress FOR ALL USING (auth.uid() = student_id);

-- 3. جدول محاولات الاختبار (exam_attempts)
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own exam attempts" ON public.exam_attempts;
CREATE POLICY "Users can view own exam attempts" ON public.exam_attempts FOR SELECT USING (auth.uid() = student_id);
DROP POLICY IF EXISTS "Users can update own exam attempts" ON public.exam_attempts;
CREATE POLICY "Users can update own exam attempts" ON public.exam_attempts FOR ALL USING (auth.uid() = student_id);

-- 4. جدول إجابات الاختبار (attempt_answers)
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own attempt answers" ON public.attempt_answers;
CREATE POLICY "Users can view own attempt answers" ON public.attempt_answers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.exam_attempts ea 
    WHERE ea.id = attempt_answers.attempt_id AND ea.student_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Users can insert own attempt answers" ON public.attempt_answers;
CREATE POLICY "Users can insert own attempt answers" ON public.attempt_answers FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.exam_attempts ea 
    WHERE ea.id = attempt_id AND ea.student_id = auth.uid()
  )
);

-- 5. جدول محاولات الاختبار الممنوحة (granted_exam_attempts)
ALTER TABLE public.granted_exam_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own granted attempts" ON public.granted_exam_attempts;
CREATE POLICY "Users can view own granted attempts" ON public.granted_exam_attempts FOR SELECT USING (auth.uid() = student_id);

-- 6. جدول ملاحظات الدروس (lesson_notes)
ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own lesson notes" ON public.lesson_notes;
CREATE POLICY "Users can view own lesson notes" ON public.lesson_notes FOR SELECT USING (auth.uid() = student_id);
DROP POLICY IF EXISTS "Users can update own lesson notes" ON public.lesson_notes;
CREATE POLICY "Users can update own lesson notes" ON public.lesson_notes FOR ALL USING (auth.uid() = student_id);
