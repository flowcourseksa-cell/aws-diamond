CREATE OR REPLACE FUNCTION reset_student_course_progress(p_student_id UUID, p_course_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Delete lesson progress
  DELETE FROM lesson_progress
  WHERE student_id = p_student_id
  AND lesson_id IN (
    SELECT l.id FROM lessons l
    JOIN tracks t ON l.track_id = t.id
    WHERE t.course_id = p_course_id
  );

  -- 2. Delete exam attempts
  DELETE FROM exam_attempts
  WHERE user_id = p_student_id
  AND exam_id IN (
    SELECT id FROM exams WHERE track_id IN (SELECT id FROM tracks WHERE course_id = p_course_id)
  );

  -- 3. Delete skill progress
  DELETE FROM skill_progress
  WHERE student_id = p_student_id
  AND micro_skill_id IN (
    SELECT m.id FROM micro_skills m
    JOIN sections s ON m.section_id = s.id
    JOIN tracks t ON s.track_id = t.id
    WHERE t.course_id = p_course_id
  );
END;
$$;