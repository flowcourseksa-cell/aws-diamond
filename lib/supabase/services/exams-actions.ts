"use server";

import { createAdminClient } from "@/lib/supabase/client";
import type { DbExam, DbQuestion, DbQuestionOption } from "./exams";

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
    console.error("Error creating exam:", error.message);
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
    console.error("Error updating exam:", error.message);
    return false;
  }
  return true;
}

export async function deleteExam(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("exams").delete().eq("id", id);
  return !error;
}

export async function saveQuestionWithOptions(
  question: Partial<DbQuestion>,
  options: Partial<DbQuestionOption>[]
): Promise<boolean> {
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
  const supabase = createAdminClient();
  const { error } = await supabase.from("questions").delete().eq("id", questionId);
  return !error;
}
