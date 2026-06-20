// @ts-nocheck
// NOTE: Supabase table types will resolve once schema.sql is applied.
// ============================================================
// محرك تتبع المهارات — منصة الأوس الماسية
// Skill Tracking Engine
// ============================================================
import { supabase } from "@/lib/supabase";
import type { ExamResult, SkillStatus, StudentSkillScore } from "@/lib/database.types";


// ── Constants ────────────────────────────────────────────────
const MASTERY_THRESHOLDS = {
  strong:  80,
  average: 60,
} as const;

// ── Core Functions ───────────────────────────────────────────

/**
 * تحديث نقاط إتقان مهارة معينة لطالب بعد الإجابة على سؤال
 * يُستدعى مع كل إجابة أو بعد تسليم الاختبار
 */
export async function updateSkillScore(
  studentId: string,
  skillId: string,
  isCorrect: boolean
): Promise<StudentSkillScore | null> {
  // جلب السجل الحالي أو إنشاؤه
  const { data: existing } = await supabase
    .from("student_skill_scores")
    .select("*")
    .eq("student_id", studentId)
    .eq("skill_id", skillId)
    .single();

  const newCorrect  = (existing?.correct_count  ?? 0) + (isCorrect ? 1 : 0);
  const newAttempts = (existing?.total_attempts ?? 0) + 1;

  const { data, error } = await supabase
    .from("student_skill_scores")
    .upsert({
      student_id:        studentId,
      skill_id:          skillId,
      correct_count:     newCorrect,
      total_attempts:    newAttempts,
      last_attempted_at: new Date().toISOString(),
    }, { onConflict: "student_id,skill_id" })
    .select()
    .single();

  if (error) { console.error("[SkillEngine] updateSkillScore:", error); return null; }
  return data;
}

/**
 * معالجة نتيجة اختبار كاملة
 * - يحدث نقاط كل مهارة
 * - يحسب النتيجة الإجمالية
 * - يُرجع تحليلاً شاملاً (ExamResult) مع قائمة المهارات الضعيفة
 * - يُنشئ إشعار الواتساب في قائمة الانتظار
 */
export async function processExamResult(
  attemptId: string,
  studentId: string,
  answers: Record<string, number>  // {question_id: selected_index}
): Promise<ExamResult | null> {

  // ١. جلب أسئلة الاختبار مع معلومات المهارات
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select(`
      *,
      exam:exams(
        *,
        exam_questions(
          question:questions(*, skill:skills(*))
        )
      )
    `)
    .eq("id", attemptId)
    .single();

  if (!attempt?.exam) return null;

  const questions = attempt.exam.exam_questions?.map((eq: any) => eq.question) ?? [];

  // ٢. تحليل الإجابات وتجميع النتائج حسب المهارة
  const skillMap: Record<string, { correct: number; total: number; skill: any }> = {};
  let totalCorrect = 0;

  for (const q of questions) {
    if (!q?.skill) continue;
    const skillId   = q.skill.id;
    const isCorrect = answers[q.id] === q.correct_index;

    if (!skillMap[skillId]) {
      skillMap[skillId] = { correct: 0, total: 0, skill: q.skill };
    }
    skillMap[skillId].total   += 1;
    skillMap[skillId].correct += isCorrect ? 1 : 0;
    if (isCorrect) totalCorrect++;

    // تحديث سجل المهارة في قاعدة البيانات
    await updateSkillScore(studentId, skillId, isCorrect);
  }

  const scorePercent = questions.length > 0
    ? Math.round((totalCorrect / questions.length) * 100)
    : 0;

  // ٣. بناء تقرير المهارات
  const skillBreakdown = Object.values(skillMap).map(({ correct, total, skill }) => {
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const status: SkillStatus = percentage >= MASTERY_THRESHOLDS.strong
      ? "strong" : percentage >= MASTERY_THRESHOLDS.average
      ? "average" : "weak";
    return { skill, correct, total, percentage, status };
  });

  const weakSkills   = skillBreakdown.filter(s => s.status === "weak"  ).map(s => s.skill);
  const strongSkills = skillBreakdown.filter(s => s.status === "strong").map(s => s.skill);

  // ٤. تحديث سجل المحاولة
  await supabase
    .from("exam_attempts")
    .update({
      answers,
      score:           scorePercent,
      correct_count:   totalCorrect,
      total_questions: questions.length,
      completed_at:    new Date().toISOString(),
      is_completed:    true,
    })
    .eq("id", attemptId);

  // ٥. صياغة رسالة الواتساب وإضافتها لقائمة الانتظار
  const whatsappMessage = buildWhatsAppMessage({
    studentName:  attempt.exam.title || "الطالب",
    examTitle:    attempt.exam.title,
    score:        scorePercent,
    weakSkills:   weakSkills.map((s: any) => s.name_ar),
    strongSkills: strongSkills.map((s: any) => s.name_ar),
  });

  await queueWhatsAppNotification(studentId, whatsappMessage);

  return {
    attempt: { ...attempt, score: scorePercent, correct_count: totalCorrect, total_questions: questions.length, is_completed: true },
    skillBreakdown,
    weakSkills,
    strongSkills,
    whatsappMessage,
  } as ExamResult;
}

/**
 * جلب المهارات الضعيفة للطالب مع روابط الشرح العلاجي
 */
export async function getStudentWeakSkills(studentId: string) {
  const { data, error } = await supabase
    .from("student_weak_skills")
    .select("*")
    .eq("student_id", studentId)
    .order("mastery_score", { ascending: true });

  if (error) { console.error("[SkillEngine] getStudentWeakSkills:", error); return []; }
  return data ?? [];
}

/**
 * جلب ملخص أداء الطالب لكل مسار
 */
export async function getStudentTrackSummary(studentId: string) {
  const { data, error } = await supabase
    .from("student_track_summary")
    .select("*")
    .eq("student_id", studentId);

  if (error) { console.error("[SkillEngine] getStudentTrackSummary:", error); return []; }
  return data ?? [];
}

/**
 * توليد اختبار علاجي مخصص لمهارة ضعيفة
 * يختار أسئلة عشوائية من المهارة لم يحلها الطالب بشكل صحيح
 */
export async function generateRemedialQuestions(
  studentId: string,
  skillId: string,
  count: number = 5
): Promise<any[]> {
  // جلب كل أسئلة المهارة
  const { data: allQuestions } = await supabase
    .from("questions")
    .select("*")
    .eq("skill_id", skillId)
    .eq("is_active", true);

  if (!allQuestions?.length) return [];

  // خلط عشوائي واختيار العدد المطلوب
  const shuffled = allQuestions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ── WhatsApp ─────────────────────────────────────────────────

/**
 * بناء رسالة الواتساب لولي الأمر
 */
function buildWhatsAppMessage({
  studentName,
  examTitle,
  score,
  weakSkills,
  strongSkills,
}: {
  studentName: string;
  examTitle: string;
  score: number;
  weakSkills: string[];
  strongSkills: string[];
}): string {
  const emoji = score >= 80 ? "🟢" : score >= 60 ? "🟡" : "🔴";
  const weakList   = weakSkills.length   > 0 ? weakSkills.join("، ")   : "لا يوجد";
  const strongList = strongSkills.length > 0 ? strongSkills.join("، ") : "لا يوجد";

  return `📊 تقرير منصة الأوس الماسية التعليمية

${emoji} أنهى ابنكم/ابنتكم اختبار *${examTitle}*

━━━━━━━━━━━━━━━━━━━━
✅ النتيجة الإجمالية: *${score}٪*
━━━━━━━━━━━━━━━━━━━━

🔴 مهارات تحتاج تحسين:
${weakList}

🟢 مهارات يتقنها:
${strongList}

━━━━━━━━━━━━━━━━━━━━
لمتابعة التقدم الكامل وخطة الدراسة المخصصة:
👉 flow-platform.com/dashboard

منصة الأوس الماسية التعليمية 💙`;
}

/**
 * إضافة إشعار واتساب لقائمة الانتظار
 * (الإرسال الفعلي يتم عبر Supabase Edge Function)
 */
export async function queueWhatsAppNotification(
  studentId: string,
  message: string
): Promise<void> {
  // جلب رقم ولي الأمر
  const { data: profile } = await supabase
    .from("student_profiles")
    .select("parent_phone")
    .eq("id", studentId)
    .single();

  if (!profile?.parent_phone) return;

  await supabase.from("whatsapp_notifications").insert({
    student_id:   studentId,
    parent_phone: profile.parent_phone,
    message_body: message,
    status:       "pending",
    scheduled_for: new Date().toISOString(),
  });
}

// ── Helper: Status Labels ────────────────────────────────────
export const SKILL_STATUS_META: Record<SkillStatus, { label: string; color: string; bg: string; icon: string }> = {
  not_started: { label: "لم يُبدأ",  color: "text-slate-500",   bg: "bg-slate-100",   icon: "⚪" },
  weak:        { label: "ضعيف",     color: "text-rose-600",    bg: "bg-rose-50",     icon: "🔴" },
  average:     { label: "متوسط",    color: "text-amber-600",   bg: "bg-amber-50",    icon: "🟡" },
  strong:      { label: "ممتاز",    color: "text-emerald-600", bg: "bg-emerald-50",  icon: "🟢" },
};

