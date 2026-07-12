// ============================================================
// API Route: معالجة تسليم الاختبار
// POST /api/exams/submit
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { processExamResult } from "@/lib/skill-engine";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { attemptId, answers } = await req.json();

    if (!attemptId || !answers) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "غير مسجل دخول" }, { status: 401 });
    }

    const studentId = user.id;

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
