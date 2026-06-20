import { createClient } from "@/lib/supabase/client";

export type SkillProgress = {
  micro_skill_id: string;
  mastery_score: number;
  total_questions_seen: number;
  correct_answers: number;
};

export type LessonProgress = {
  lesson_id: string;
  is_completed: boolean;
  progress_seconds: number;
};

export async function fetchUserProgress(userId: string) {
  const supabase = createClient();
  
  // Fetch skill progress
  const { data: skills, error: skillsError } = await supabase
    .from("skill_progress")
    .select("micro_skill_id, mastery_score, total_questions_seen, correct_answers")
    .eq("student_id", userId);

  if (skillsError) {
    console.error("Error fetching skill progress:", skillsError);
  }

  // Fetch lesson progress
  const { data: lessons, error: lessonsError } = await supabase
    .from("lesson_progress")
    .select("lesson_id, is_completed, progress_seconds")
    .eq("student_id", userId);

  if (lessonsError) {
    console.error("Error fetching lesson progress:", lessonsError);
  }

  return {
    skills: (skills as SkillProgress[]) || [],
    lessons: (lessons as LessonProgress[]) || [],
  };
}

export async function markLessonCompleted(userId: string, lessonId: string, progressSeconds: number = 0) {
  const supabase = createClient();

  const { error } = await supabase
    .from("lesson_progress")
    .upsert({
      student_id: userId,
      lesson_id: lessonId,
      is_completed: true,
      progress_seconds: progressSeconds,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "student_id, lesson_id"
    });

  if (error) {
    console.error("Error marking lesson completed:", error);
    return false;
  }
  return true;
}

export async function submitExamAttempt(userId: string, examId: string, answers: { question_id: string; selected_option_id: string | null; is_correct: boolean; micro_skill_id: string }[]) {
  const supabase = createClient();

  // Calculate score pct
  const total = answers.length;
  const correct = answers.filter((a) => a.is_correct).length;
  const scorePct = total > 0 ? (correct / total) * 100 : 0;

  // Insert attempt
  const { data: attempt, error: attemptError } = await supabase
    .from("exam_attempts")
    .insert([{
      student_id: userId,
      exam_id: examId,
      score_pct: scorePct,
      submitted_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (attemptError || !attempt) {
    console.error("Error creating exam attempt:", attemptError);
    return false;
  }

  // Insert answers
  const answersData = answers.map((ans) => ({
    attempt_id: attempt.id,
    question_id: ans.question_id,
    selected_option_id: ans.selected_option_id,
    is_correct: ans.is_correct,
    micro_skill_id: ans.micro_skill_id
  }));

  const { error: answersError } = await supabase
    .from("attempt_answers")
    .insert(answersData);

  if (answersError) {
    console.error("Error inserting attempt answers:", answersError);
    return false;
  }

  // Call RPC to update skill progress based on the attempt
  const { error: rpcError } = await supabase.rpc("calculate_skill_gap", {
    p_student_id: userId,
    p_attempt_id: attempt.id
  });

  if (rpcError) {
    console.error("Error calculating skill gap via RPC:", rpcError);
  }

  return true;
}
