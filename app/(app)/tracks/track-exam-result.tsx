// @ts-nocheck
"use client";

import {
  IconCheck, IconX, IconMinus, IconBrain,
  IconPlayerPlay, IconArrowRight, IconAlertTriangle, IconVideo,
} from "@tabler/icons-react";
import type { SkillQuestion } from "@/lib/store";
import { usePlatformStore } from "@/lib/store";

const LETTERS = ["أ", "ب", "ج", "د"];
const RADIUS = 78;
const CIRC = 2 * Math.PI * RADIUS;

interface Props {
  exam: { id: string; trackId: string; sectionId: string; name: string; questions: SkillQuestion[] };
  answers: (number | null)[];
  attemptsCount: number;
  maxAttempts?: number;
  isTraining?: boolean;
  evaluatedResult?: { scorePct: number; evaluatedAnswers: any[]; isPendingSync: boolean };
  onRetry: () => void;
  onBack: () => void;
}

export function TrackExamResult({ exam, answers, attemptsCount, maxAttempts = 5, isTraining = false, evaluatedResult, onRetry, onBack }: Props) {
  const isPendingSync = evaluatedResult?.isPendingSync ?? false;
  const total   = exam.questions.length;
  const skipped = exam.questions.filter((_, i) => answers[i] === null).length;
  
  let correct = 0;
  let wrong = 0;
  let percent = 0;

  if (!isPendingSync && evaluatedResult?.evaluatedAnswers) {
    correct = evaluatedResult.evaluatedAnswers.filter((a: any) => a.is_correct).length;
    wrong = total - correct - skipped;
    percent = Math.round(evaluatedResult.scorePct || 0);
  }

  const offset  = CIRC - (percent / 100) * CIRC;

  const color   = percent >= 80 ? "#10b981" : percent >= 60 ? "#f59e0b" : "#ef4444";
  const grade   = percent >= 90 ? "ممتاز 🌟" : percent >= 75 ? "جيد جداً 👏" : percent >= 50 ? "مقبول 🙂" : "راجع مجدداً 📚";

  // Only show answers if the student scored 100% or reached absolute max attempts
  const canSeeAnswers = percent === 100 || attemptsCount >= maxAttempts;

  // ── تحليل المهارات ──────────────────────────────────────────
  const skillMap: Record<string, { name: string; correct: number; total: number }> = {};
  exam.questions.forEach((q, i) => {
    if (!skillMap[q.skillId]) skillMap[q.skillId] = { name: q.skillName, correct: 0, total: 0 };
    skillMap[q.skillId].total++;
    
    if (!isPendingSync && evaluatedResult?.evaluatedAnswers) {
      const isCorrect = evaluatedResult.evaluatedAnswers.find((ea: any) => ea.question_id === q.id)?.is_correct;
      if (isCorrect) skillMap[q.skillId].correct++;
    }
  });

  const skillResults = Object.entries(skillMap).map(([id, v]) => ({
    id, ...v,
    score: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
    status: (v.total > 0 ? v.correct / v.total : 0) >= 0.8 ? "strong" : (v.total > 0 ? v.correct / v.total : 0) >= 0.6 ? "average" : "weak",
  }));

  const weakSkills   = skillResults.filter(s => s.status === "weak");
  const strongSkills = skillResults.filter(s => s.status === "strong");

  const { tracks, lessons } = usePlatformStore();
  const allSkills = tracks.flatMap(t => t.sections.flatMap(sec => sec.skills));
  const remedialSkills = weakSkills.map(ws => ({
    ...ws,
    remedialVideoUrl: allSkills.find(s => s.id === ws.id)?.remedialVideoUrl,
  }));

  // Group weak skills by lesson (assuming skills and lessons share a sectionId)
  const weakSkillsByLesson = new Map<string, { lessonTitle: string, skills: typeof remedialSkills }>();
  
  remedialSkills.forEach(sk => {
    let sectionId = "";
    tracks.forEach(t => t.sections.forEach(sec => {
      if (sec.skills.some(s => s.id === sk.id)) sectionId = sec.id;
    }));
    
    const lesson = lessons.find(l => l.sectionId === sectionId);
    if (lesson) {
      if (!weakSkillsByLesson.has(lesson.id)) {
        weakSkillsByLesson.set(lesson.id, { lessonTitle: lesson.title, skills: [] });
      }
      weakSkillsByLesson.get(lesson.id)!.skills.push(sk);
    }
  });

  return (
    <>
      {/* نتيجة الاختبار */}
      {isPendingSync ? (
        <div className="fade-up rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 p-8 text-center">
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-amber-100">
            <IconAlertTriangle size={48} className="text-amber-600" />
          </div>
          <div className="text-xl font-extrabold mb-2 text-amber-800">أنت في وضع عدم الاتصال (Offline)</div>
          <div className="text-sm text-amber-700 font-medium leading-loose max-w-sm mx-auto">
            تم حفظ إجاباتك محلياً بشكل آمن. لا يمكننا عرض النتيجة أو الإجابات الصحيحة حالياً لأنها تتطلب تصحيحاً من الخادم لحماية الأسئلة. سيتم رفع النتيجة تلقائياً بمجرد اتصالك بالإنترنت.
          </div>
        </div>
      ) : (
        <div className="fade-up rounded-2xl border border-border bg-card p-8 text-center">
          <div className="relative mx-auto mb-5 h-44 w-44">
            <svg width="176" height="176" viewBox="0 0 180 180" className="-rotate-90">
              <circle cx="90" cy="90" r={RADIUS} strokeWidth="12" fill="none" className="stroke-border" />
              <circle
                cx="90" cy="90" r={RADIUS} strokeWidth="12" fill="none"
                stroke={color} strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={offset}
                className="transition-[stroke-dashoffset] duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[36px] font-black">{percent}%</div>
              <div className="text-[12px] font-bold text-text-muted">نسبة النجاح</div>
            </div>
          </div>

          <div className="text-xl font-extrabold mb-1">{grade}</div>
          <div className="text-sm text-text-muted mb-6">{exam.name}</div>

          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { val: total,   label: "إجمالي",  color: "text-text" },
              { val: correct, label: "صحيح",    color: "text-emerald-600" },
              { val: wrong,   label: "خطأ",     color: "text-rose-600" },
              { val: skipped, label: "لم يُجب", color: "text-text-muted" },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-border bg-bg p-3">
                <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
                <div className="text-[11px] font-bold text-text-muted mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* تحليل المهارات */}
      {!isPendingSync && (
        <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <IconBrain size={20} className="text-primary" />
          <div className="font-extrabold text-base">تحليل المهارات</div>
        </div>
        <div className="space-y-3">
          {skillResults.map(sk => (
            <div key={sk.id} className={`p-3 rounded-xl border ${
              sk.status === "strong"  ? "bg-emerald-50 border-emerald-200" :
              sk.status === "average" ? "bg-amber-50  border-amber-200"   :
                                        "bg-rose-50   border-rose-200"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">{sk.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-black ${
                    sk.status === "strong" ? "text-emerald-600" :
                    sk.status === "average"? "text-amber-600"   : "text-rose-600"
                  }`}>{sk.score}%</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    sk.status === "strong"  ? "bg-emerald-100 text-emerald-700" :
                    sk.status === "average" ? "bg-amber-100  text-amber-700"   :
                                              "bg-rose-100   text-rose-700"
                  }`}>
                    {sk.status === "strong" ? "ممتاز" : sk.status === "average" ? "متوسط" : "ضعيف"}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-white/70 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    sk.status === "strong" ? "bg-emerald-500" :
                    sk.status === "average"? "bg-amber-400"   : "bg-rose-500"
                  }`}
                  style={{ width: `${sk.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* المهارات الضعيفة مع الشرح العلاجي (فقط عند استنفاد المحاولات بدون 100% وبحد أقصى 10 محاولات) */}
      {percent < 100 && attemptsCount >= maxAttempts && attemptsCount < 10 && Array.from(weakSkillsByLesson.entries()).length > 0 && (
        <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-5 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <IconAlertTriangle size={20} className="text-rose-600" />
            <div className="font-extrabold text-base text-rose-800">
              لديك {remedialSkills.length} مهارة يجب أن تتدرب عليها لفتح المحاولة القادمة
            </div>
          </div>
          <div className="space-y-4">
            {Array.from(weakSkillsByLesson.entries()).map(([lessonId, data]) => (
              <div key={lessonId} className="bg-white rounded-xl p-4 border border-rose-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="font-extrabold text-[14.5px] text-text mb-1">
                      درس: {data.lessonTitle}
                    </div>
                    <div className="text-xs font-semibold text-text-muted">
                      يجب مراجعة هذا الدرس للتدرب على المهارات التالية:
                    </div>
                  </div>
                  <a
                    href={`/lessons?lessonId=${lessonId}&examId=${exam.id}&remediateSkillIds=${data.skills.map(s => s.id).join(",")}`}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex-shrink-0"
                  >
                    <IconPlayerPlay size={16} />
                    الذهاب لمراجعة الدرس
                  </a>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {data.skills.map(sk => (
                    <div key={sk.id} className="bg-rose-50 text-rose-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-100 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      {sk.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* رسالة إشعار الحفظ */}
      {!isTraining ? (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">📝</span>
            </div>
            <div>
              <div className="font-extrabold text-indigo-800 mb-1">تم حفظ نتيجتك (ضمن المحاولات الرسمية) ✅</div>
              <div className="text-sm text-indigo-700 font-medium leading-relaxed">
                هذه المحاولة رقم {attemptsCount}. النظام يعتمد تلقائياً الدرجة الأعلى من بين أول {maxAttempts} محاولات كحد أقصى للتقرير الخاص بك.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-slate-300 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-slate-600 text-lg">ℹ️</span>
            </div>
            <div>
              <div className="font-extrabold text-slate-800 mb-1">محاولة تدريبية إضافية</div>
              <div className="text-sm text-slate-600 font-medium leading-relaxed">
                هذه المحاولة للتدريب والمراجعة فقط (إما لأنك حصلت على الدرجة النهائية مسبقاً أو لاستنفاد المحاولات الرسمية) ولن تغير درجتك الأعلى المعتمدة في التقارير.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مراجعة الأسئلة */}
      <div className="font-extrabold text-base mt-2">مراجعة الأسئلة</div>
      
      {!canSeeAnswers ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <div className="font-extrabold text-amber-800 mb-2 text-lg">إجابات الأسئلة والشرح مخفية 🔒</div>
          <div className="text-[13.5px] text-amber-700 font-medium leading-loose">
            تُخفى الإجابات في المحاولات الأولى لتحفيزك على التفكير والمحاولة من جديد.
            <br/>
            ستتمكن من رؤية الإجابات الصحيحة والشرح التفصيلي بعد استنفادك جميع المحاولات النهائية (<b className="font-black text-amber-900">10 محاولات</b>)، أو في حال حصولك على درجة <b className="font-black text-amber-900">100%</b>.
            <br/>
            <div className="mt-3 inline-block bg-amber-100 text-amber-800 px-4 py-2 rounded-xl font-bold">
              لقد حاولت {attemptsCount} {attemptsCount === 1 ? 'مرة واحدة' : attemptsCount === 2 ? 'مرتين' : 'مرات'} حتى الآن.
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {exam.questions.map((q, i) => {
            const ua = answers[i];
            const evalAns = evaluatedResult?.evaluatedAnswers?.find((a: any) => a.question_id === q.id);
            const isCorrect = evalAns?.is_correct ?? false;
            
            return (
              <div key={q.id} className="fade-up rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {q.skillName}
                  </span>
                </div>
                <div className="text-[15px] font-bold leading-loose mb-3">{i + 1}. {q.questionText}</div>
                {ua === null ? (
                  <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-500">
                    <IconMinus size={16} /> لم تُجب
                  </div>
                ) : isCorrect ? (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    <IconCheck size={16} /> {LETTERS[ua]}) {q.options[ua]} — صحيحة ✅
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                      <IconX size={16} /> إجابتك: {LETTERS[ua]}) {q.options[ua]} — خاطئة
                    </div>
                  </div>
                )}
                <div className="mt-3 rounded-xl bg-bg p-3 text-sm text-text-muted leading-loose">
                  <b className="text-text">الشرح:</b> {q.explanation}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-3">
        {attemptsCount < 10 || percent >= 100 ? (
          <button onClick={onRetry} className={`h-12 flex-1 rounded-xl text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 ${isTraining ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-primary hover:bg-primary-dark'}`}>
            <IconPlayerPlay size={18} /> {isTraining ? "محاولة تدريبية" : "إعادة الاختبار"}
          </button>
        ) : (
          <div className="h-12 flex-1 rounded-xl bg-slate-100 text-slate-500 font-bold text-sm border border-slate-200 flex items-center justify-center gap-2 cursor-not-allowed">
            <IconX size={18} /> استنفدت المحاولات ({maxAttempts}/{maxAttempts})
          </div>
        )}
        <button onClick={onBack} className="h-12 flex-1 rounded-xl border border-border bg-card text-sm font-bold hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
          <IconArrowRight size={18} /> العودة
        </button>
      </div>
    </>
  );
}
