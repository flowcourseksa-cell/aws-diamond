import { createClient, createAdminClient } from "@/lib/supabase/client";

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

// ─── Exams ────────────────────────────────────────────────────────────────────

export async function fetchExamsByTracks(trackIds: string[]): Promise<DbExam[]> {
  if (trackIds.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .in("track_id", trackIds)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message === 'Failed to fetch' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      console.warn("Network offline, cannot fetch exams.");
    } else {
      console.warn("Error fetching exams:", error);
    }
    return [];
  }
  return data as DbExam[];
}

export async function createExam(exam: Partial<DbExam>): Promise<DbExam | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("exams")
    .insert([{
      track_id: exam.track_id,
      section_id: exam.section_id,
      title: exam.title,
      time_limit_seconds: exam.time_limit_seconds || 3600,
      access_type: exam.access_type || 'paid',
      price: exam.price || 0,
      is_published: exam.is_published || false,
    }])
    .select()
    .single();

  if (error) {
    console.error("Error creating exam:", error);
    return null;
  }
  return data as DbExam;
}

export async function updateExam(id: string, exam: Partial<DbExam>): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("exams")
    .update({
      track_id: exam.track_id,
      section_id: exam.section_id,
      title: exam.title,
      time_limit_seconds: exam.time_limit_seconds,
      access_type: exam.access_type,
      price: exam.price,
      is_published: exam.is_published,
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating exam:", error);
    return false;
  }
  return true;
}

export async function deleteExam(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("exams").delete().eq("id", id);
  return !error;
}

// ─── Builder (Questions & Options) ──────────────────────────────────────────

export async function fetchExamBuilderData(examId: string): Promise<ExamWithDetails | null> {
  const supabase = createClient();
  
  // We fetch the exam, then questions, then options in one nested query!
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

  // Sort questions by order_index
  if (data && data.questions) {
    data.questions.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
  }

  return data as unknown as ExamWithDetails;
}

export async function saveQuestionWithOptions(
  question: Partial<DbQuestion>, 
  options: Partial<DbQuestionOption>[]
): Promise<boolean> {
  const supabase = createAdminClient();

  // If question.id exists, it's an update, else insert.
  let questionId = question.id;

  if (questionId) {
    // UPDATE QUESTION
    const { error: qError } = await supabase
      .from("questions")
      .update({
        micro_skill_id: question.micro_skill_id,
        text: question.text,
        explanation: question.explanation,
        difficulty: question.difficulty,
      })
      .eq("id", questionId);
    if (qError) { console.error("Error updating question:", qError); return false; }
    
    // DELETE old options and re-insert them (simplest way to handle option changes in builder)
    await supabase.from("question_options").delete().eq("question_id", questionId);
  } else {
    // INSERT QUESTION
    const { data: newQ, error: iError } = await supabase
      .from("questions")
      .insert([{
        exam_id: question.exam_id,
        micro_skill_id: question.micro_skill_id,
        text: question.text,
        explanation: question.explanation,
        difficulty: question.difficulty || 'medium',
        order_index: question.order_index || 0
      }])
      .select()
      .single();

    if (iError || !newQ) { console.error("Error inserting question:", iError); return false; }
    questionId = newQ.id;
  }

  // INSERT OPTIONS
  if (options.length > 0 && questionId) {
    const optsToInsert = options.map(o => ({
      question_id: questionId,
      text: o.text,
      is_correct: o.is_correct || false,
    }));
    
    const { error: optsError } = await supabase
      .from("question_options")
      .insert(optsToInsert);

    if (optsError) { console.error("Error inserting options:", optsError); return false; }
  }

  return true;
}

export async function deleteQuestion(questionId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("questions").delete().eq("id", questionId);
  return !error;
}

