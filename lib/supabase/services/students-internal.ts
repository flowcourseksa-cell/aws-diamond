// وحدة خادم داخلية (ليست "use server"): تُستدعى من إجراء الإدارة المحمي ومن مهمة الخمول المجدولة
// (التي لا تملك جلسة مستخدم وتُفوَّض بـ CRON_SECRET في المسار نفسه).
import { createAdminClient } from "@/lib/supabase/client";

/** يحذف التسجيل وكل تقدم الطالب في الدورة (محاولات، دروس، خطة دراسية، مهارات). */
export async function unenrollStudentInternal(enrollmentId: string): Promise<boolean> {
  const supabase = createAdminClient();

  // 1. Fetch enrollment to know the student and course
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("student_id, course_id")
    .eq("id", enrollmentId)
    .single();

  if (!enrollment) {
    console.error("Enrollment not found");
    return false;
  }

  const { student_id, course_id } = enrollment;

  // Fetch Tracks
  const { data: tracks } = await supabase.from("tracks").select("id").eq("course_id", course_id);
  if (tracks && tracks.length > 0) {
    const trackIds = tracks.map((t: any) => t.id);

    // 2. Clear Exams Attempts (exams belong to tracks)
    const { data: exams } = await supabase.from("exams").select("id").in("track_id", trackIds);
    if (exams && exams.length > 0) {
      const examIds = exams.map((e: any) => e.id);
      await supabase.from("exam_attempts").delete().eq("student_id", student_id).in("exam_id", examIds);
    }

    // 3. Clear Lesson Progress & Skills
    const { data: sections } = await supabase.from("sections").select("id").in("track_id", trackIds);
    if (sections && sections.length > 0) {
      const sectionIds = sections.map((s: any) => s.id);
      
      // 3a. Clear Lessons
      const { data: lessons } = await supabase.from("lessons").select("id").in("section_id", sectionIds);
      if (lessons && lessons.length > 0) {
        const lessonIds = lessons.map((l: any) => l.id);
        await supabase.from("lesson_progress").delete().eq("student_id", student_id).in("lesson_id", lessonIds);
      }

      // 3b. Clear Study Plan Tasks & Skill Progress (micro_skills belong to sections)
      const { data: micros } = await supabase.from("micro_skills").select("id").in("section_id", sectionIds);
      if (micros && micros.length > 0) {
        const microIds = micros.map((m: any) => m.id);
        // Clear remedial tasks
        await supabase.from("study_plan_tasks").delete().eq("student_id", student_id).in("micro_skill_id", microIds);
        // Clear actual skill progress
        await supabase.from("skill_progress").delete().eq("student_id", student_id).in("micro_skill_id", microIds);
      }
    }
  }

  // 5. Delete the enrollment itself
  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq("id", enrollmentId);

  if (error) {
    console.error("Error unenrolling student:", error.message);
    return false;
  }
  return true;
}
