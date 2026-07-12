"use client";

import { IconHelpCircle, IconClock, IconLock, IconPlayerPlay, IconChevronDown, IconChevronUp, IconX } from "@tabler/icons-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { usePlatformStore } from "@/lib/store";
import { useState } from "react";
import Link from "next/link";

export function scoreColor(score: number) {
  if (score >= 75) return "var(--accent-teal)";
  if (score >= 50) return "var(--accent-amber)";
  return "var(--accent-red)";
}

type TrackExamCard = {
  id: string;
  trackId: string;
  sectionId: string;
  name: string;
  timeMinutes: number;
  accessType: "free" | "paid";
  questionsCount: number;
  bestScore?: number;
  attemptsCount?: number;
  maxAttempts?: number;
  isLocked?: boolean;
  isExhausted?: boolean;
  weakSkills?: { id: string; name: string; lessonId: string | null }[];
};

type Props = {
  exams: TrackExamCard[];
  hasActiveSubscription: boolean;
  onStart: (id: string) => void;
  pulseExamId?: string | null;
};

export function ExamList({ exams, hasActiveSubscription, onStart, pulseExamId }: Props) {
  const { tracks } = usePlatformStore();
  const [showWeakSkillsModal, setShowWeakSkillsModal] = useState<string | null>(null);

  if (exams.length === 0) {
    return (
      <div className="col-span-full flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-text-muted">
        لا توجد اختبارات في هذا التصنيف
      </div>
    );
  }

  // اجلب لون المسار
  const trackColor = (trackId: string) =>
    tracks.find(t => t.id === trackId)?.color ?? "#6366f1";
  const trackName = (trackId: string) =>
    tracks.find(t => t.id === trackId)?.name ?? "";

  return (
    <>
      {exams.map((exam, i) => {
        const locked = exam.accessType === "paid" && !hasActiveSubscription;
        const color  = trackColor(exam.trackId);
        const score  = exam.bestScore ?? 0;
        const isPulsing = pulseExamId === exam.id;

        return (
          <div
            key={exam.id}
            className={`fade-up flex flex-col gap-3.5 rounded-2xl border bg-card p-5 transition-all duration-300 hover:-translate-y-0.75 hover:shadow-[0_8px_24px_rgba(15,17,23,0.05)] ${
              isPulsing ? "border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)] scale-[1.02]" : "border-border"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11.5 w-11.5 flex-shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ background: color }}
                >
                  <IconHelpCircle size={21} />
                </div>
                <div>
                  <div className="text-[15px] font-extrabold leading-tight">{exam.name}</div>
                  <div className="text-xs font-semibold mt-0.5" style={{ color }}>{trackName(exam.trackId)}</div>
                </div>
              </div>
              {locked || exam.isLocked ? (
                <span className="flex items-center gap-1 rounded-lg bg-accent-amber-light px-2.5 py-1 text-[11px] font-bold text-accent-amber">
                  <IconLock size={12} /> {locked ? "مدفوع" : "مغلق"}
                </span>
              ) : score > 0 ? (
                <span className="flex items-center gap-1 rounded-lg bg-accent-teal-light px-2.5 py-1 text-[11px] font-bold text-accent-teal">
                  مكتمل ✓
                </span>
              ) : (
                <span className="rounded-lg bg-accent-blue-light px-2.5 py-1 text-[11px] font-bold text-accent-blue">
                  جديد
                </span>
              )}
            </div>

            {/* Meta */}
            <div className="flex gap-3.5 text-[12.5px] font-semibold text-text-muted">
              <span className="flex items-center gap-1.25">
                <IconHelpCircle size={15} /> {exam.questionsCount} أسئلة
              </span>
              <span className="flex items-center gap-1.25">
                <IconClock size={15} /> {exam.timeMinutes} دقيقة
              </span>
            </div>

            {/* Score bar */}
            {score > 0 ? (
              <div className="mt-2">
                <div className="flex items-center justify-between text-[13px] font-bold mb-2">
                  <span className="text-text-muted">أعلى نتيجة</span>
                  <span style={{ color: scoreColor(score) }}>{score}%</span>
                </div>
                <ProgressBar percent={score} color={scoreColor(score)} />
              </div>
            ) : (
              <div className="text-[13px] text-text-muted mt-2">لم تقم بحل هذا الاختبار من قبل</div>
            )}

            {/* CTA */}
            <div className="mt-4">
              {locked ? (
                <button className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-accent-amber/10 border border-accent-amber/20 text-[13.5px] font-bold text-accent-amber hover:bg-accent-amber hover:text-white transition-colors">
                  <IconLock size={16} /> محتوى مدفوع — اشترك للوصول
                </button>
              ) : exam.isLocked ? (
                <button 
                  onClick={() => onStart(exam.id)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-slate-100 text-[13.5px] font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <IconLock size={16} /> يجب مشاهدة الدروس بالكامل أولاً
                </button>
              ) : (
                <button
                  onClick={() => {
                    const isTraining = (exam.attemptsCount ?? 0) >= 10 || (exam.bestScore ?? 0) >= 80;
                    if (exam.isExhausted && !isTraining) {
                      setShowWeakSkillsModal(exam.id);
                    } else {
                      onStart(exam.id);
                    }
                  }}
                  className={`flex h-11 w-full items-center justify-center gap-2 rounded-[10px] text-[14px] font-bold transition-all shadow-sm ${
                    exam.isExhausted && !((exam.attemptsCount ?? 0) >= 10 || (exam.bestScore ?? 0) >= 80)
                      ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100" 
                      : 'bg-primary text-white hover:bg-primary-dark hover:shadow-md'
                  }`}
                >
                  <IconPlayerPlay size={16} />
                  {(exam.attemptsCount ?? 0) >= 10 || (exam.bestScore ?? 0) >= 100 
                    ? "محاولة تدريبية" 
                    : (exam.isExhausted ? "استنفدت المحاولات - راجع الدروس" : (score > 0 ? "أعد المحاولة" : "ابدأ الاختبار 🚀"))}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Weak Skills Modal */}
      {showWeakSkillsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(15,17,23,0.8)] p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-lg rounded-3xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowWeakSkillsModal(null)} 
              className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg border border-transparent hover:border-border transition-colors text-text-muted hover:text-text"
            >
              <IconX size={20} />
            </button>
            
            <div className="text-center mb-6 mt-2">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-red-light/30 text-accent-red">
                <IconLock size={28} />
              </div>
              <h2 className="text-xl font-black mb-2">الاختبار مغلق حالياً</h2>
              <p className="text-sm font-bold text-text-muted leading-relaxed">
                لقد استنفذت المحاولات التدريبية. لفتح محاولة جديدة، يجب عليك مراجعة الدروس واجتياز تحديات المهارات التالية:
              </p>
            </div>
            
            <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto px-1">
              {(() => {
                const modalExam = exams.find(e => e.id === showWeakSkillsModal);
                if (!modalExam?.weakSkills || modalExam.weakSkills.length === 0) {
                   return (
                     <div className="text-center p-4 bg-bg rounded-xl border border-border">
                       <p className="text-text-muted text-sm font-bold">لا توجد مهارات مسجلة لهذا الاختبار، يرجى التواصل مع الدعم الفني.</p>
                     </div>
                   );
                }
                return modalExam.weakSkills.map(skill => (
                  <div
                    key={skill.id}
                    className="flex items-center justify-between bg-bg border border-border rounded-xl p-3 shadow-sm"
                  >
                    <span className="font-bold text-[13px]">{skill.name}</span>
                    {skill.lessonId ? (
                      <Link
                        href={`/lessons?lessonId=${skill.lessonId}&examId=${showWeakSkillsModal}&remediateSkillIds=${skill.id}`}
                        className="bg-primary text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
                      >
                        مراجعة الدرس
                      </Link>
                    ) : (
                      <span className="text-text-muted text-xs font-bold px-2 py-1">لا يوجد درس</span>
                    )}
                  </div>
                ));
              })()}
            </div>
            
            <button 
              onClick={() => setShowWeakSkillsModal(null)}
              className="mt-6 w-full h-12 rounded-xl bg-bg border border-border text-text font-bold hover:bg-card transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </>
  );
}
