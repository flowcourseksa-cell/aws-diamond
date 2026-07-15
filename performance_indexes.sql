-- ============================================================
-- 🚀 Performance Indexes for TKHSAS Platform
-- 
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Press RUN (F5)
-- Safe to run multiple times (IF NOT EXISTS prevents errors)
-- ============================================================


-- ─── 1. Final Exam Attempts ───────────────────────────────────
-- Speeds up: جلب محاولات الطالب في الاختبار النهائي
-- Used in: fetchStudentFinalExamAttempts()
CREATE INDEX IF NOT EXISTS idx_final_exam_attempts_student_exam
  ON final_exam_attempts (student_id, final_exam_id);

CREATE INDEX IF NOT EXISTS idx_final_exam_attempts_submitted_at
  ON final_exam_attempts (final_exam_id, submitted_at DESC);


-- ─── 2. Exam Attempts (Track Exams) ──────────────────────────
-- Speeds up: جلب نتائج اختبارات الطلاب في كل المسارات
-- Used in: submitSecureExamAttempt(), checkFinalExamUnlock()
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_exam
  ON exam_attempts (student_id, exam_id);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_id
  ON exam_attempts (student_id);


-- ─── 3. Lesson Progress ──────────────────────────────────────
-- Speeds up: حساب نسبة إتمام الدروس لفتح الاختبار النهائي
-- Used in: checkFinalExamUnlock()
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_completed
  ON lesson_progress (student_id, is_completed);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id
  ON lesson_progress (lesson_id);


-- ─── 4. Skill Progress ───────────────────────────────────────
-- Speeds up: حساب متوسط إتقان المهارات
-- Used in: checkFinalExamUnlock()
CREATE INDEX IF NOT EXISTS idx_skill_progress_student_id
  ON skill_progress (student_id);

CREATE INDEX IF NOT EXISTS idx_skill_progress_student_skill
  ON skill_progress (student_id, micro_skill_id);


-- ─── 5. Attempt Answers ──────────────────────────────────────
-- Speeds up: جلب إجابات محاولة معينة لعرض التصحيح
-- Used in: submitSecureExamAttempt() RPC
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_id
  ON attempt_answers (attempt_id);


-- ─── 6. Final Exam Questions ─────────────────────────────────
-- Speeds up: جلب أسئلة الاختبار النهائي (cached but still useful)
-- Used in: fetchFinalExamByCourse(), gradeSimulatorAttempt()
CREATE INDEX IF NOT EXISTS idx_final_exam_questions_exam_id
  ON final_exam_questions (final_exam_id, order_index);

CREATE INDEX IF NOT EXISTS idx_final_exam_question_options_question_id
  ON final_exam_question_options (question_id);


-- ─── 7. Certificates ─────────────────────────────────────────
-- Speeds up: جلب شهادة الطالب في دورة معينة
-- Used in: fetchCertificateForCourse()
CREATE INDEX IF NOT EXISTS idx_certificates_student_course
  ON certificates (student_id, course_id);


-- ─── 8. Lessons by Track ─────────────────────────────────────
-- Speeds up: عد الدروس الإجمالية في مسار
-- Used in: checkFinalExamUnlock()
CREATE INDEX IF NOT EXISTS idx_lessons_track_id
  ON lessons (track_id);


-- ─── 9. Tracks by Course ─────────────────────────────────────
-- Speeds up: جلب مسارات الدورة
-- Used in: checkFinalExamUnlock() and many other places
CREATE INDEX IF NOT EXISTS idx_tracks_course_id
  ON tracks (course_id);


-- ─── 10. Study Plan Tasks ────────────────────────────────────
-- Speeds up: جلب خطة الدراسة للطالب
CREATE INDEX IF NOT EXISTS idx_study_plan_tasks_student_id
  ON study_plan_tasks (student_id);


-- ─── Verify all indexes were created ─────────────────────────
SELECT
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
