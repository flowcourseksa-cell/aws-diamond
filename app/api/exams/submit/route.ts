// ============================================================
// API Route: معالجة تسليم الاختبار
// POST /api/exams/submit
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { processExamResult } from "@/lib/skill-engine";

export async function POST(req: NextRequest) {
  try {
    const { attemptId, answers } = await req.json();

    if (!attemptId || !answers) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    // جلب الـ student_id من الجلسة
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "غير مسجل دخول" }, { status: 401 });
    }

    const studentId = session.user.id;

    // معالجة النتيجة
    const result = await processExamResult(attemptId, studentId, answers);

    if (!result) {
      return NextResponse.json({ error: "فشل في معالجة النتيجة" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      score:        result.attempt.score,
      weakSkills:   result.weakSkills.map((s: any) => ({ id: s.id, name: s.name_ar })),
      strongSkills: result.strongSkills.map((s: any) => ({ id: s.id, name: s.name_ar })),
      skillBreakdown: result.skillBreakdown.map(sb => ({
        skillName:  sb.skill.name_ar,
        percentage: sb.percentage,
        status:     sb.status,
        correct:    sb.correct,
        total:      sb.total,
      })),
    });
  } catch (err: any) {
    console.error("[API] /api/exams/submit:", err);
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
