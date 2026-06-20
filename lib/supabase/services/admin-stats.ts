import { createClient } from "@/lib/supabase/client";

export type WeeklyExamPoint = { day: string; count: number };

export type WeakSkillStat = {
  micro_skill_id: string;
  name: string;
  track_name: string;
  track_color: string;
  mastery_score: number;
};

export type AdminStats = {
  totalStudents: number;
  activeSubscriptions: number;
  totalCourses: number;
  activeCourses: number;
  totalExams: number;
  freeExams: number;
  totalLessons: number;
  newLessons: number;
  totalSkills: number;
  weeklyExams: WeeklyExamPoint[];
  weakSkills: WeakSkillStat[];
};

const AR_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

// All numbers come straight from Supabase. No mock / hardcoded data.
export async function fetchAdminStats(): Promise<AdminStats> {
  const supabase = createClient();

  const startOfWeek = new Date();
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday

  const [
    studentsRes,
    enrollmentsRes,
    coursesRes,
    examsRes,
    lessonsRes,
    skillsRes,
    attemptsRes,
    progressRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("enrollments").select("student_id"),
    supabase.from("courses").select("id, is_active"),
    supabase.from("exams").select("id, access_type"),
    supabase.from("lessons").select("id, status"),
    supabase.from("micro_skills").select("id", { count: "exact", head: true }),
    supabase
      .from("exam_attempts")
      .select("submitted_at")
      .not("submitted_at", "is", null)
      .gte("submitted_at", startOfWeek.toISOString()),
    supabase
      .from("skill_progress")
      .select("micro_skill_id, mastery_score, micro_skills(name, sections(tracks(name, color)))")
      .lt("mastery_score", 50)
      .order("mastery_score", { ascending: true })
      .limit(5),
  ]);

  const courses = coursesRes.data || [];
  const exams = examsRes.data || [];
  const lessons = lessonsRes.data || [];

  // Distinct students that have at least one enrollment.
  const activeSubscriptions = new Set(
    (enrollmentsRes.data || []).map((e: any) => e.student_id)
  ).size;

  // Build the weekly exam-completion chart from real attempts.
  const weeklyCounts = new Array(7).fill(0);
  (attemptsRes.data || []).forEach((a: any) => {
    if (!a.submitted_at) return;
    const d = new Date(a.submitted_at);
    weeklyCounts[d.getDay()] += 1;
  });
  const weeklyExams: WeeklyExamPoint[] = AR_DAYS.map((day, i) => ({
    day,
    count: weeklyCounts[i],
  }));

  const weakSkills: WeakSkillStat[] = (progressRes.data || []).map((row: any) => ({
    micro_skill_id: row.micro_skill_id,
    name: row.micro_skills?.name || "مهارة",
    track_name: row.micro_skills?.sections?.tracks?.name || "",
    track_color: row.micro_skills?.sections?.tracks?.color || "#ef4444",
    mastery_score: Math.round(row.mastery_score ?? 0),
  }));

  return {
    totalStudents: studentsRes.count ?? 0,
    activeSubscriptions,
    totalCourses: courses.length,
    activeCourses: courses.filter((c: any) => c.is_active).length,
    totalExams: exams.length,
    freeExams: exams.filter((e: any) => e.access_type === "free").length,
    totalLessons: lessons.length,
    newLessons: lessons.filter((l: any) => l.status === "new").length,
    totalSkills: skillsRes.count ?? 0,
    weeklyExams,
    weakSkills,
  };
}
