"use client";

import { IconHelpCircle, IconClock, IconLock, IconPlayerPlay } from "@tabler/icons-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { FLOW_TRACKS } from "@/lib/mock-data";

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
};

type Props = {
  exams: TrackExamCard[];
  hasActiveSubscription: boolean;
  onStart: (id: string) => void;
};

export function ExamList({ exams, hasActiveSubscription, onStart }: Props) {
  if (exams.length === 0) {
    return (
      <div className="col-span-full flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-text-muted">
        لا توجد اختبارات في هذا التصنيف
      </div>
    );
  }

  // اجلب لون المسار
  const trackColor = (trackId: string) =>
    FLOW_TRACKS.find(t => t.id === trackId)?.color ?? "#6366f1";
  const trackName = (trackId: string) =>
    FLOW_TRACKS.find(t => t.id === trackId)?.name ?? "";

  return (
    <>
      {exams.map((exam, i) => {
        const locked = exam.accessType === "paid" && !hasActiveSubscription;
        const color  = trackColor(exam.trackId);
        const score  = exam.bestScore ?? 0;

        return (
          <div
            key={exam.id}
            className={`fade-up delay-${(i % 4) + 1} flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.75 hover:shadow-[0_8px_24px_rgba(15,17,23,0.05)]`}
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
              {locked ? (
                <span className="flex items-center gap-1 rounded-lg bg-accent-amber-light px-2.5 py-1 text-[11px] font-bold text-accent-amber">
                  <IconLock size={12} /> مدفوع
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
              <div>
                <div className="flex items-center justify-between text-[12.5px] font-bold mb-1.5">
                  <span>أعلى نتيجة</span>
                  <span style={{ color: scoreColor(score) }}>{score}%</span>
                </div>
                <ProgressBar percent={score} color={scoreColor(score)} />
              </div>
            ) : (
              <div className="text-[12.5px] text-text-muted">لم تقم بحل هذا الاختبار من قبل</div>
            )}

            {/* CTA */}
            {locked ? (
              <button className="flex h-10.5 items-center justify-center gap-2 rounded-[10px] bg-accent-amber-light text-[13.5px] font-bold text-accent-amber hover:bg-accent-amber hover:text-white transition-colors">
                <IconLock size={16} /> محتوى مدفوع — اشترك للوصول
              </button>
            ) : (
              <button
                onClick={() => onStart(exam.id)}
                className="flex h-10.5 items-center justify-center gap-2 rounded-[10px] bg-primary text-[13.5px] font-bold text-white hover:bg-primary-dark transition-colors"
              >
                <IconPlayerPlay size={16} />
                {score > 0 ? "أعد المحاولة" : "ابدأ الاختبار"}
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}
