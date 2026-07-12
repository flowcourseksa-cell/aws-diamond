import { createClient } from "@/lib/supabase/client";

// Admin write operations live in a server-only module ("use server").
// Re-exported here so existing imports keep working unchanged.
export {
  createExam, updateExam, deleteExam,
  saveQuestionWithOptions, deleteQuestion,
} from "./exams-actions";

export type DbExam = {
  id: string;
  track_id: string;
  section_id: string | null;
  title: string;
  time_limit_seconds: number;
  access_type: "free" | "paid";
  price: number;
  is_published: boolean;
  created_at: string;
};

export type DbQuestion = {
  id: string;
  exam_id: string;
  micro_skill_id: string; // CRITICAL
  text: string;
  explanation: string | null;
  difficulty: "easy" | "medium" | "hard";
  order_index: number;
  created_at: string;
};

export type DbQuestionOption = {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  created_at: string;
};

export type ExamWithDetails = DbExam & {
  questions: (DbQuestion & { options: DbQuestionOption[] })[];
};

// ─── Read API (browser, anon key + RLS) ─────────────────────────────────────

export async function fetchExamsByTracks(trackIds: string[]): Promise<DbExam[]> {
  if (trackIds.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("exams")
    .select(`
      *,
      questions (
        *,
        micro_skills(name),
        question_options (id, question_id, text, created_at)
      )
    `)
    .in("track_id", trackIds)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message === 'Failed to fetch' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      console.warn("Network offline, cannot fetch exams.");
      throw new Error("offline");
    } else {
      console.warn("Error fetching exams:", error);
    }
    return [];
  }
  return data as DbExam[];
}

export async function fetchExamBuilderData(examId: string): Promise<ExamWithDetails | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("exams")
    .select(`
      *,
      questions (
        *,
        options:question_options (*)
      )
    `)
    .eq("id", examId)
    .single();

  if (error) {
    if (error.message === 'Failed to fetch' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      console.warn("Network offline, cannot fetch exam details.");
    } else {
      console.warn("Error fetching exam details:", error);
    }
    return null;
  }

  if (data && data.questions) {
    data.questions.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
  }

  return data as unknown as ExamWithDetails;
}
