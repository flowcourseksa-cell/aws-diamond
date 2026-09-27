"use server";

import { createClient } from "@supabase/supabase-js";
import { insertCertificate } from "@/lib/supabase/services/certificates-internal";
import { requireUserId } from "@/lib/supabase/verify-admin";

/**
 * إجراء خاص بالطالب (session-bound): الشهادة تُصدر دائماً لصاحب الجلسة،
 * ويُتجاهل معرّف الطالب القادم من العميل (التوقيع ثابت حتى لا يتغير المستدعون).
 * يرمي "غير مصرح لك" إن لم توجد جلسة — المستدعي يلتقط الاستثناء أصلاً.
 */
export async function gradeSimulatorAttempt(
  courseId: string,
  examId: string,
  answers: Record<string, string | null>, // question_id -> option_id
  _studentId: string,
  _userName: string,
  _examTitle: string
) {
  const studentId = await requireUserId();

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 0. الاختبار يجب أن يتبع الدورة المطلوبة، والاسم والعنوان يُقرآن من قاعدة البيانات لا من العميل
  const [{ data: exam }, { data: profile }] = await Promise.all([
    supabaseAdmin.from("final_exams").select("id, course_id, title").eq("id", examId).single(),
    supabaseAdmin.from("profiles").select("full_name").eq("id", studentId).single(),
  ]);
  if (!exam || exam.course_id !== courseId) {
    throw new Error("Invalid exam");
  }
  const { data: course } = await supabaseAdmin.from("courses").select("title").eq("id", courseId).single();
  const studentName = (profile?.full_name || "").trim() || "طالب متميز";
  const certificateTitle = (exam.title || course?.title || "").trim() || "محاكي اختبار ستيب";

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
  const newCert = await insertCertificate({
    student_id: studentId,
    course_id: courseId,
    final_exam_id: examId,
    score_pct: percentage,
    student_name: studentName,
    course_title: certificateTitle,
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
