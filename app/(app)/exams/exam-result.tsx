"use client";

import { useEffect, useState } from "react";
import { IconCheck, IconX, IconMinus } from "@tabler/icons-react";
import type { ExamQuestion } from "@/lib/types";
import { scoreColor } from "./exam-list";

const LETTERS = ["أ", "ب", "ج", "د"];
const RADIUS = 78;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type ExamResultProps = {
  questions: ExamQuestion[];
  answers: (number | null)[];
  onRetry: () => void;
  onBackToList: () => void;
};

export function ExamResult({ questions, answers, onRetry, onBackToList }: ExamResultProps) {
  const [offset, setOffset] = useState(CIRCUMFERENCE);

  const total = questions.length;
  const correct = questions.filter((q, i) => answers[i] === q.correctIndex).length;
  const wrong = questions.filter((q, i) => answers[i] !== null && answers[i] !== q.correctIndex).length;
  const skipped = questions.filter((_, i) => answers[i] === null).length;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  useEffect(() => {
    const targetOffset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
    const timeout = setTimeout(() => setOffset(targetOffset), 100);
    return () => clearTimeout(timeout);
  }, [percent]);

  let grade: string, sub: string;
  if (percent >= 90) {
    grade = "ممتاز 🌟";
    sub = "أداء رائع! أنت على الطريق الصحيح للمئوية الكاملة";
  } else if (percent >= 75) {
    grade = "جيد جداً 👏";
    sub = "أداء قوي، استمر في المراجعة للوصول للتميز";
  } else if (percent >= 50) {
    grade = "مقبول 🙂";
    sub = "يمكنك التحسن أكثر، راجع الأسئلة الخاطئة بعناية";
  } else {
    grade = "راجع مجدداً 📚";
    sub = "نوصي بمراجعة هذه المادة من البداية قبل إعادة المحاولة";
  }

  const color = scoreColor(percent);

  return (
    <>
      <div className="fade-up mb-5 rounded-2xl border border-border bg-card p-10 text-center">
        <div className="relative mx-auto mb-5 h-45 w-45">
          <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
            <circle cx="90" cy="90" r={RADIUS} strokeWidth="12" fill="none" className="stroke-border" />
            <circle
              cx="90"
              cy="90"
              r={RADIUS}
              strokeWidth="12"
              fill="none"
              stroke={color}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              className="transition-[stroke-dashoffset] duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[38px] font-black">{percent}%</div>
            <div className="text-[12.5px] font-bold text-text-muted">نسبة النجاح</div>
          </div>
        </div>

        <div className="mb-1.5 text-xl font-extrabold">{grade}</div>
        <div className="text-[13.5px] text-text-muted">{sub}</div>

        <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-bg p-4">
            <div className="text-[22px] font-black">{total}</div>
            <div className="mt-1 text-[11.5px] font-bold text-text-muted">إجمالي الأسئلة</div>
          </div>
          <div className="rounded-xl border border-border bg-bg p-4">
            <div className="text-[22px] font-black text-accent-teal">{correct}</div>
            <div className="mt-1 text-[11.5px] font-bold text-text-muted">إجابات صحيحة</div>
          </div>
          <div className="rounded-xl border border-border bg-bg p-4">
            <div className="text-[22px] font-black text-accent-red">{wrong}</div>
            <div className="mt-1 text-[11.5px] font-bold text-text-muted">إجابات خاطئة</div>
          </div>
          <div className="rounded-xl border border-border bg-bg p-4">
            <div className="text-[22px] font-black text-text-muted">{skipped}</div>
            <div className="mt-1 text-[11.5px] font-bold text-text-muted">لم تُجب</div>
          </div>
        </div>
      </div>

      <div className="mb-4 text-base font-extrabold">مراجعة الأسئلة</div>
      <div className="flex flex-col gap-3.5">
        {questions.map((q, i) => {
          const userAnswer = answers[i];
          const isCorrect = userAnswer === q.correctIndex;
          return (
            <div key={q.id} className="fade-up rounded-2xl border border-border bg-card p-5.5">
              <div className="mb-3.5 text-[15px] font-bold leading-loose">
                {i + 1}. {q.questionText}
              </div>

              {userAnswer === null ? (
                <div className="mb-2 flex items-center gap-2.5 rounded-[10px] bg-accent-red-light px-3.5 py-3 text-[13.5px] font-bold text-accent-red">
                  <IconMinus size={16} /> لم تُجب على هذا السؤال
                </div>
              ) : isCorrect ? (
                <div className="mb-2 flex items-center gap-2.5 rounded-[10px] bg-accent-teal-light px-3.5 py-3 text-[13.5px] font-bold text-accent-teal">
                  <IconCheck size={16} /> إجابتك: {LETTERS[userAnswer]}) {q.options[userAnswer]} — صحيحة
                </div>
              ) : (
                <>
                  <div className="mb-2 flex items-center gap-2.5 rounded-[10px] bg-accent-red-light px-3.5 py-3 text-[13.5px] font-bold text-accent-red">
                    <IconX size={16} /> إجابتك: {LETTERS[userAnswer]}) {q.options[userAnswer]} — خاطئة
                  </div>
                  <div className="mb-2 flex items-center gap-2.5 rounded-[10px] bg-accent-teal-light px-3.5 py-3 text-[13.5px] font-bold text-accent-teal">
                    <IconCheck size={16} /> الإجابة الصحيحة: {LETTERS[q.correctIndex]}) {q.options[q.correctIndex]}
                  </div>
                </>
              )}

              <div className="mt-2 rounded-[10px] bg-bg p-3.5 text-[13px] leading-loose text-text-muted">
                <b className="text-text">الشرح:</b> {q.explanation}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={onRetry}
          className="h-11.5 flex-1 rounded-[10px] bg-primary text-sm font-bold text-white transition-colors duration-200 hover:bg-primary-dark"
        >
          إعادة الاختبار
        </button>
        <button
          onClick={onBackToList}
          className="h-11.5 flex-1 rounded-[10px] border border-border bg-card text-sm font-bold text-text transition-colors duration-200 hover:border-primary hover:text-primary"
        >
          العودة للقائمة
        </button>
      </div>
    </>
  );
}
