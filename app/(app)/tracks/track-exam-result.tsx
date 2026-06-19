"use client";

import {
  IconCheck, IconX, IconMinus, IconBrain,
  IconPlayerPlay, IconArrowRight, IconAlertTriangle, IconVideo,
} from "@tabler/icons-react";
import type { SkillQuestion } from "@/lib/mock-data";
import { FLOW_TRACKS } from "@/lib/mock-data";

const LETTERS = ["أ", "ب", "ج", "د"];
const RADIUS = 78;
const CIRC = 2 * Math.PI * RADIUS;

interface Props {
  exam: { id: string; trackId: string; sectionId: string; name: string; questions: SkillQuestion[] };
  answers: (number | null)[];
  onRetry: () => void;
  onBack: () => void;
}

export function TrackExamResult({ exam, answers, onRetry, onBack }: Props) {
  const total   = exam.questions.length;
  const correct = exam.questions.filter((q, i) => answers[i] === q.correctIndex).length;
  const wrong   = exam.questions.filter((q, i) => answers[i] !== null && answers[i] !== q.correctIndex).length;
  const skipped = exam.questions.filter((_, i) => answers[i] === null).length;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  const offset  = CIRC - (percent / 100) * CIRC;

  const color   = percent >= 80 ? "#10b981" : percent >= 60 ? "#f59e0b" : "#ef4444";
  const grade   = percent >= 90 ? "ممتاز 🌟" : percent >= 75 ? "جيد جداً 👏" : percent >= 50 ? "مقبول 🙂" : "راجع مجدداً 📚";

  // ── تحليل المهارات ──────────────────────────────────────────
  const skillMap: Record<string, { name: string; correct: number; total: number }> = {};
  exam.questions.forEach((q, i) => {
    if (!skillMap[q.skillId]) skillMap[q.skillId] = { name: q.skillName, correct: 0, total: 0 };
    skillMap[q.skillId].total++;
    if (answers[i] === q.correctIndex) skillMap[q.skillId].correct++;
  });

  const skillResults = Object.entries(skillMap).map(([id, v]) => ({
    id, ...v,
    score: Math.round((v.correct / v.total) * 100),
    status: v.correct / v.total >= 0.8 ? "strong" : v.correct / v.total >= 0.6 ? "average" : "weak",
  }));

  const weakSkills   = skillResults.filter(s => s.status === "weak");
  const strongSkills = skillResults.filter(s => s.status === "strong");

  // إيجاد فيديوهات علاجية للمهارات الضعيفة
  const allSkills = FLOW_TRACKS.flatMap(t => t.sections.flatMap(sec => sec.skills));
  const remedialSkills = weakSkills.map(ws => ({
    ...ws,
    remedialVideoUrl: allSkills.find(s => s.id === ws.id)?.remedialVideoUrl,
  }));

  return (
    <>
      {/* نتيجة الاختبار */}
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

      {/* تحليل المهارات */}
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

      {/* المهارات الضعيفة مع الشرح العلاجي */}
      {remedialSkills.length > 0 && (
        <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <IconAlertTriangle size={20} className="text-rose-600" />
            <div className="font-extrabold text-base text-rose-800">
              مهارات تحتاج مراجعة ({remedialSkills.length})
            </div>
          </div>
          <div className="space-y-3">
            {remedialSkills.map(sk => (
              <div key={sk.id} className="bg-white rounded-xl p-4 border border-rose-200 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-rose-800">{sk.name}</div>
                  <div className="text-xs text-rose-600 mt-0.5">
                    أجبت صح على {sk.correct} من {sk.total} ({sk.score}%)
                  </div>
                </div>
                {sk.remedialVideoUrl ? (
                  <a
                    href={sk.remedialVideoUrl}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex-shrink-0"
                  >
                    <IconVideo size={16} />
                    شرح مخصص
                  </a>
                ) : (
                  <span className="text-xs text-rose-400 font-medium flex-shrink-0">قريباً</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* رسالة إشعار الواتساب */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg">💬</span>
          </div>
          <div>
            <div className="font-extrabold text-emerald-800 mb-1">تم إرسال تقرير لولي الأمر ✅</div>
            <div className="text-sm text-emerald-700 font-medium leading-relaxed">
              تم إرسال رسالة واتساب تلقائية لولي الأمر تتضمن نتيجة الاختبار ({percent}%) والمهارات التي تحتاج تحسيناً.
            </div>
          </div>
        </div>
      </div>

      {/* مراجعة الأسئلة */}
      <div className="font-extrabold text-base">مراجعة الأسئلة</div>
      <div className="space-y-3">
        {exam.questions.map((q, i) => {
          const ua = answers[i];
          const isCorrect = ua === q.correctIndex;
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
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    <IconCheck size={16} /> الصحيحة: {LETTERS[q.correctIndex]}) {q.options[q.correctIndex]}
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

      <div className="flex gap-3">
        <button onClick={onRetry} className="h-12 flex-1 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
          <IconPlayerPlay size={18} /> إعادة الاختبار
        </button>
        <button onClick={onBack} className="h-12 flex-1 rounded-xl border border-border bg-card text-sm font-bold hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
          <IconArrowRight size={18} /> العودة للأقسام
        </button>
      </div>
    </>
  );
}
