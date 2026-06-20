"use client";

import { useEffect, useState } from "react";
import type { SkillQuestion as ExamQuestion } from "@/lib/store";
import { ProgressBar } from "@/components/ui/progress-bar";

const LETTERS = ["أ", "ب", "ج", "د"];

type ExamRunnerProps = {
  examTitle: string;
  questions: ExamQuestion[];
  timeMinutes: number;
  onFinish: (answers: (number | null)[]) => void;
};

export function ExamRunner({ examTitle, questions, timeMinutes, onFinish }: ExamRunnerProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => new Array(questions.length).fill(null));
  const [remainingSeconds, setRemainingSeconds] = useState(timeMinutes * 60);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      onFinish(answers);
      return;
    }
    const interval = setInterval(() => {
      setRemainingSeconds((s) => s - 1);
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds]);

  const question = questions[currentQ];
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isDanger = remainingSeconds <= 120;
  const isLast = currentQ === questions.length - 1;

  function selectOption(optionIndex: number) {
    setAnswers((prev) => prev.map((a, i) => (i === currentQ ? optionIndex : a)));
  }

  function handleNext() {
    if (isLast) {
      onFinish(answers);
    } else {
      setCurrentQ((q) => q + 1);
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5.5 py-4.5">
        <h2 className="text-[17px] font-extrabold">{examTitle}</h2>
        <div
          className={`rounded-[10px] px-5 py-2 text-[22px] font-black transition-colors duration-300 ${
            isDanger ? "bg-accent-red-light text-accent-red pulse" : "bg-primary-light text-primary"
          }`}
        >
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      <div className="mb-2 text-[13px] font-bold text-text-muted">
        السؤال {currentQ + 1} من {questions.length}
      </div>
      <div className="mb-4.5">
        <ProgressBar percent={((currentQ + 1) / questions.length) * 100} />
      </div>

      <div className="mb-4 rounded-2xl border border-border bg-card p-7">
        <div className="mb-5.5 text-lg font-bold leading-loose">{question.questionText}</div>
        <div className="flex flex-col gap-3">
          {question.options.map((opt, i) => {
            const selected = answers[currentQ] === i;
            return (
              <button
                key={i}
                onClick={() => selectOption(i)}
                className={`flex items-center gap-3.5 rounded-xl border-[1.5px] px-4.5 py-4 text-right text-[14.5px] font-semibold transition-colors duration-200 ${
                  selected ? "border-primary bg-primary-light" : "border-border hover:border-primary"
                }`}
              >
                <span
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border text-[13px] font-extrabold ${
                    selected ? "border-primary bg-primary text-white" : "border-border bg-bg"
                  }`}
                >
                  {LETTERS[i]}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between gap-2.5">
        <button
          onClick={() => onFinish(answers)}
          className="h-11.5 rounded-[10px] border border-border bg-accent-red px-7 text-sm font-bold text-white transition-colors duration-200 hover:opacity-90"
        >
          إنهاء الاختبار
        </button>
        <div className="flex gap-2.5">
          <button
            onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
            disabled={currentQ === 0}
            className="h-11.5 rounded-[10px] border border-border bg-card px-7 text-sm font-bold text-text transition-colors duration-200 hover:border-primary hover:text-primary disabled:opacity-50"
          >
            السابق
          </button>
          <button
            onClick={handleNext}
            className="h-11.5 rounded-[10px] bg-primary px-7 text-sm font-bold text-white transition-colors duration-200 hover:bg-primary-dark"
          >
            {isLast ? "تأكيد الإجابة" : "التالي"}
          </button>
        </div>
      </div>
    </>
  );
}

