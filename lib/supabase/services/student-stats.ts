import { createClient } from "@/lib/supabase/client";

export type StudentStats = {
  avgMastery: number;
  totalSkills: number;
  masteredSkills: number;
  averageSkills: number;
  weakSkills: number;
  completedLessons: number;
  totalLessons: number;
  availableExams: number;
  studyHours: number;
  topWeakSkills: { id: string; name: string; track: string; score: number }[];
};

// All numbers are real, per-student data from Supabase (isolated by RLS).
export async function fetchStudentStats(userId: string): Promise<StudentStats> {
  const supabase = createClient();

  const [progressRes, lessonsCountRes, completedRes, examsCountRes] = await Promise.all([
    supabase
      .from("skill_progress")
      .select("micro_skill_id, mastery_score, micro_skills(name, sections(tracks(name)))")
      .eq("student_id", userId),
    supabase.from("lessons").select("id", { count: "exact", head: true }),
    supabase
      .from("lesson_progress")
      .select("lesson_id, progress_seconds")
      .eq("student_id", userId)
      .eq("is_completed", true),
    supabase.from("exams").select("id", { count: "exact", head: true }).eq("is_published", true),
  ]);

  const progress = progressRes.data || [];
  const totalSkills = progress.length;

  const masteredSkills = progress.filter((s: any) => s.mastery_score >= 80).length;
  const weakList = progress.filter((s: any) => s.mastery_score > 0 && s.mastery_score < 50);
  const averageSkills = progress.filter((s: any) => s.mastery_score >= 50 && s.mastery_score < 80).length;
  const weakSkills = weakList.length;

  const avgMastery = totalSkills > 0
    ? Math.round(progress.reduce((sum: number, s: any) => sum + (s.mastery_score || 0), 0) / totalSkills)
    : 0;

  const completedRows = completedRes.data || [];
  const completedLessons = completedRows.length;

  // Real study hours = sum of tracked seconds across completed lessons.
  const totalSeconds = completedRows.reduce((sum: number, r: any) => sum + (r.progress_seconds || 0), 0);
  const studyHours = Math.round((totalSeconds / 3600) * 10) / 10;

  const topWeakSkills = [...weakList]
    .sort((a: any, b: any) => a.mastery_score - b.mastery_score)
    .slice(0, 3)
    .map((s: any) => ({
      id: s.micro_skill_id,
      name: s.micro_skills?.name || "مهارة",
      track: s.micro_skills?.sections?.tracks?.name || "",
      score: Math.round(s.mastery_score || 0),
    }));

  return {
    avgMastery,
    totalSkills,
    masteredSkills,
    averageSkills,
    weakSkills,
    completedLessons,
    totalLessons: lessonsCountRes.count ?? 0,
    availableExams: examsCountRes.count ?? 0,
    studyHours,
    topWeakSkills,
  };
}
