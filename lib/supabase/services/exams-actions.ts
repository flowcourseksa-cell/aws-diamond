"use server";
import { verifyAdminAccess } from "@/lib/supabase/verify-admin";


import { createAdminClient } from "@/lib/supabase/client";
import type { DbExam, DbQuestion, DbQuestionOption } from "./exams";

export async function createExam(exam: Partial<DbExam>): Promise<DbExam | null> {
  await verifyAdminAccess();
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
    console.error("Error creating exam:", error.message);
    return null;
  }
  return data as DbExam;
}

export async function updateExam(id: string, exam: Partial<DbExam>): Promise<boolean> {
  await verifyAdminAccess();
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
    console.error("Error updating exam:", error.message);
    return false;
  }
  return true;
}

export async function deleteExam(id: string): Promise<boolean> {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { error } = await supabase.from("exams").delete().eq("id", id);
  return !error;
}

export async function saveQuestionWithOptions(
  question: Partial<DbQuestion>,
  options: Partial<DbQuestionOption>[]
): Promise<boolean> {
  await verifyAdminAccess();
  const supabase = createAdminClient();

  let questionId = question.id;

  if (questionId) {
    const { error: qError } = await supabase
      .from("questions")
      .update({
        micro_skill_id: question.micro_skill_id,
        text: question.text,
        explanation: question.explanation,
        difficulty: question.difficulty,
      })
      .eq("id", questionId);
    if (qError) { console.error("Error updating question:", qError.message); return false; }

    await supabase.from("question_options").delete().eq("question_id", questionId);
  } else {
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

    if (iError || !newQ) { console.error("Error inserting question:", iError?.message); return false; }
    questionId = newQ.id;
  }

  if (options.length > 0 && questionId) {
    const optsToInsert = options.map(o => ({
      question_id: questionId,
      text: o.text,
      is_correct: o.is_correct || false,
    }));

    const { error: optsError } = await supabase
      .from("question_options")
      .insert(optsToInsert);

    if (optsError) { console.error("Error inserting options:", optsError.message); return false; }
  }

  return true;
}

export async function deleteQuestion(questionId: string): Promise<boolean> {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { error } = await supabase.from("questions").delete().eq("id", questionId);
  return !error;
}

export async function bulkSaveExamQuestions(
  examId: string,
  microSkillId: string,
  questions: {
    text: string;
    difficulty: string;
    options: { text: string; is_correct: boolean }[];
  }[]
): Promise<{ success: number; failed: number }> {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  let success = 0;
  let failed = 0;

  // Get current max order_index to append
  const { data: existing } = await supabase
    .from("questions")
    .select("order_index")
    .eq("exam_id", examId)
    .order("order_index", { ascending: false })
    .limit(1);
    
  let nextIndex = existing && existing.length > 0 ? (existing[0].order_index || 0) + 1 : 0;

  for (const q of questions) {
    try {
      const { data: newQ, error: qError } = await supabase
        .from("questions")
        .insert([{
          exam_id: examId,
          micro_skill_id: microSkillId,
          text: q.text,
          explanation: null,
          difficulty: q.difficulty,
          order_index: nextIndex++
        }])
        .select()
        .single();

      if (qError || !newQ) {
        failed++;
        continue;
      }

      if (q.options && q.options.length > 0) {
        const optsToInsert = q.options.map((o) => ({
          question_id: newQ.id,
          text: o.text,
          is_correct: o.is_correct || false,
        }));

        const { error: optsError } = await supabase
          .from("question_options")
          .insert(optsToInsert);

        if (optsError) { console.error("Error inserting options:", optsError.message); return { success, failed }; }
      }
      
      success++;
    } catch (e) {
      failed++;
    }
  }

  return { success, failed };
}