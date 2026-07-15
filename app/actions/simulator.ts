"use server";

import { createClient } from "@supabase/supabase-js";
import { createCertificate } from "@/lib/supabase/services/certificates";

export async function gradeSimulatorAttempt(
  courseId: string,
  examId: string,
  answers: Record<string, string | null>, // question_id -> option_id
  studentId: string,
  userName: string,
  examTitle: string
) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Fetch all questions and options for this exam
  const { data: questionsData, error } = await supabaseAdmin
    .from("final_exam_questions")
    .select(`
      id,
      section_type,
      options:final_exam_question_options(id, is_correct)
    `)
    .eq("final_exam_id", examId);

  if (error || !questionsData) {
    throw new Error("Failed to fetch exam data for grading");
  }

  // 2. Grade locally on server
  let score = 0;
  const sections: Record<string, { total: number; correct: number; label: string }> = {
    reading: { total: 0, correct: 0, label: "الاستيعاب المقروء" },
    grammar: { total: 0, correct: 0, label: "التراكيب النحوية" },
    listening: { total: 0, correct: 0, label: "فهم المسموع" },
    analysis: { total: 0, correct: 0, label: "التحليل الكتابي" }
  };

  questionsData.forEach((q) => {
    const selectedOptionId = answers[q.id];
    const correctOption = q.options.find(o => o.is_correct);
    const type = q.section_type || 'grammar';

    if (!sections[type]) sections[type] = { total: 0, correct: 0, label: type };
    sections[type].total++;

    if (correctOption && selectedOptionId === correctOption.id) {
      score++;
      sections[type].correct++;
    }
  });

  const percentage = Math.round((score / questionsData.length) * 100);
  const passed = percentage >= 50;

  // 3. Create Certificate if passed or even if failed (simulator creates certificate anyway)
  // Actually simulator creates it always.
  const newCert = await createCertificate({
    student_id: studentId,
    course_id: courseId,
    final_exam_id: examId,
    score_pct: percentage,
    student_name: userName || 'طالب متميز',
    course_title: examTitle
  });

  return {
    score,
    total: questionsData.length,
    percentage,
    passed,
    sections,
    certId: newCert ? newCert.id : null
  };
}
