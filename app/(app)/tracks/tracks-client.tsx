"use client";

import { useState, useEffect } from "react";
import {
  IconChevronDown, IconChevronUp,
  IconCircleCheck, IconAlertTriangle, IconCircle,
  IconPlayerPlay, IconBrain, IconVideo, IconTarget,
} from "@tabler/icons-react";
import { type FlowTrack, type FlowSection, type FlowSkill } from "@/lib/mock-data";
import { usePlatformStore, type AdminExam } from "@/lib/store";
import { ExamRunner } from "@/app/(app)/exams/exam-runner";
import { TrackExamResult } from "./track-exam-result";
import { useRouter } from "next/navigation";

// ── Status meta ───────────────────────────────────────────────
const STATUS_META = {
  strong:      { label: "ممتاز",    icon: IconCircleCheck,   color: "text-emerald-600", bg: "bg-emerald-50",  border: "border-emerald-200", bar: "bg-emerald-500" },
  average:     { label: "متوسط",    icon: IconAlertTriangle, color: "text-amber-600",   bg: "bg-amber-50",    border: "border-amber-200",   bar: "bg-amber-400"   },
  weak:        { label: "ضعيف",     icon: IconAlertTriangle, color: "text-rose-600",    bg: "bg-rose-50",     border: "border-rose-200",    bar: "bg-rose-500"    },
  not_started: { label: "لم يُبدأ", icon: IconCircle,        color: "text-slate-400",   bg: "bg-slate-50",    border: "border-slate-200",   bar: "bg-slate-300"   },
};

// ── SkillBar ─────────────────────────────────────────────────
function SkillBar({ skill }: { skill: FlowSkill }) {
  const meta = STATUS_META[skill.status];
  const Icon = meta.icon;
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${meta.bg} ${meta.border}`}>
      <Icon size={15} className={meta.color} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-bold text-text truncate">{skill.name}</span>
          <span className={`text-xs font-black ${meta.color} flex-shrink-0 mr-2`}>{skill.masteryScore}%</span>
        </div>
        <div className="h-1.5 bg-white/70 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${meta.bar}`}
            style={{ width: `${skill.masteryScore}%` }}
          />
        </div>
        {skill.status === "weak" && (
          <div className={`mt-1 text-[10.5px] font-bold ${meta.color}`}>{meta.label} — يحتاج تحسين</div>
        )}
      </div>
      {skill.status === "weak" && skill.remedialVideoUrl && (
        <a
          href={skill.remedialVideoUrl}
          title="شرح علاجي"
          className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-200 transition-colors"
        >
          <IconVideo size={14} />
        </a>
      )}
    </div>
  );
}

function SectionCard({
  section, trackColor, onStartExam, sectionExams
}: {
  section: FlowSection;
  trackColor: string;
  onStartExam: (examId: string) => void;
  sectionExams: AdminExam[];
}) {
  const [open, setOpen] = useState(false);

  const avgScore  = section.skills.length > 0 ? Math.round(section.skills.reduce((s, sk) => s + sk.masteryScore, 0) / section.skills.length) : 0;
  const weakCount = section.skills.filter(sk => sk.status === "weak").length;

  const barColor = avgScore >= 80 ? "bg-emerald-500" : avgScore >= 60 ? "bg-amber-400" : "bg-rose-500";

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-bg transition-colors text-right gap-3"
      >
        {/* Left: color dot + name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: trackColor }} />
          <div className="min-w-0">
            <div className="font-extrabold text-[15px] text-text">{section.name}</div>
            <div className="text-xs text-text-muted mt-0.5 flex items-center gap-2">
              <span>{section.skills.length} مهارة</span>
              {weakCount > 0 && (
                <span className="text-rose-500 font-bold">• {weakCount} ضعيفة</span>
              )}
              {sectionExams.length > 0 && (
                <span className="text-indigo-500 font-bold">• {sectionExams.length} اختبار</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: score + chevron */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-left hidden sm:block">
            <div className="text-base font-black text-text">{avgScore}%</div>
            <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden mt-1">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${avgScore}%` }} />
            </div>
          </div>
          {open ? <IconChevronUp size={18} className="text-text-muted" /> : <IconChevronDown size={18} className="text-text-muted" />}
        </div>
      </button>

      {/* Section body */}
      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-3">
          {/* Exam buttons */}
          {sectionExams.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-1">
              {sectionExams.map(exam => (
                <button
                  key={exam.id}
                  onClick={() => onStartExam(exam.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all hover:-translate-y-0.5"
                  style={{
                    background: `${trackColor}12`,
                    borderColor: `${trackColor}40`,
                    color: trackColor,
                  }}
                >
                  <IconPlayerPlay size={14} />
                  {exam.name}
                </button>
              ))}
            </div>
          )}

          {/* Skills */}
          <div className="grid grid-cols-1 gap-2">
            {section.skills.map(sk => <SkillBar key={sk.id} skill={sk} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
type ViewState =
  | { view: "list" }
  | { view: "exam"; examId: string }
  | { view: "result"; examId: string; answers: (number | null)[] };

export function TracksClient() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const storeTracks = usePlatformStore(s => s.tracks);
  const storeExams = usePlatformStore(s => s.exams);
  const enrolledCourseId = usePlatformStore(s => s.enrolledCourseId);
  const courses = usePlatformStore(s => s.courses);
  
  const [selectedTrack, setSelectedTrack] = useState<string>("");
  const [state, setState] = useState<ViewState>({ view: "list" });

  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return <div className="p-8 text-center text-text-muted font-bold">جاري التحميل...</div>;

  const currentCourse = courses.find(c => c.id === enrolledCourseId);

  if (!enrolledCourseId || !currentCourse) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center bg-card rounded-2xl border border-border mt-10 shadow-lg" dir="rtl">
        <IconAlertTriangle size={64} className="text-amber-500 mb-4" />
        <h2 className="text-2xl font-black mb-3">أنت غير مشترك في أي دورة حالياً</h2>
        <p className="text-text-muted font-medium mb-6">يرجى الاشتراك في دورة للوصول إلى المسارات التعليمية.</p>
        <button onClick={() => router.push("/#courses")} className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-colors">
          تصفح الدورات المتاحة
        </button>
      </div>
    );
  }

  const activeTracks = storeTracks.filter(t => currentCourse.trackIds.includes(t.id));
  const currentSelectedTrack = activeTracks.some(t => t.id === selectedTrack) ? selectedTrack : (activeTracks[0]?.id || "");
  const activeTrack = activeTracks.find(t => t.id === currentSelectedTrack);
  
  const activeExamObj = state.view !== "list"
    ? storeExams.find(e => e.id === state.examId)
    : null;

  // ── Exam flow ──────────────────────────────────────────────
  if (state.view === "exam" && activeExamObj) {
    return (
      <ExamRunner
        examTitle={activeExamObj.name}
        questions={activeExamObj.questions}
        timeMinutes={activeExamObj.timeMinutes}
        onFinish={answers => setState({ view: "result", examId: activeExamObj.id, answers })}
      />
    );
  }

  if (state.view === "result" && activeExamObj) {
    return (
      <TrackExamResult
        exam={activeExamObj}
        answers={state.answers}
        onRetry={() => setState({ view: "exam", examId: activeExamObj.id })}
        onBack={() => setState({ view: "list" })}
      />
    );
  }

  if (!activeTrack) return <div className="p-8 text-center text-text-muted font-bold">لا يوجد مسارات متاحة...</div>;

  // ── Stats for active track ─────────────────────────────────
  const allSkills    = activeTrack.sections.flatMap(s => s.skills);
  const avgMastery   = allSkills.length > 0 ? Math.round(allSkills.reduce((s, sk) => s + sk.masteryScore, 0) / allSkills.length) : 0;
  const weakCount    = allSkills.filter(sk => sk.status === "weak").length;
  const strongCount  = allSkills.filter(sk => sk.status === "strong").length;
  const notStarted   = allSkills.filter(sk => sk.status === "not_started").length;

  return (
    <>
      {/* ─── Page Header ──────────────────────────────────── */}
      <section className="fade-up rounded-2xl bg-sidebar px-7 py-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <IconBrain size={28} />
          <h2 className="text-xl font-black">الأقسام والمهارات</h2>
        </div>
        <p className="text-white/55 text-sm">
          اختر مسارك ثم تصفح أقسامه ومهاراته — اختبر نفسك وتتبع تقدمك بدقة
        </p>
      </section>

      {/* ─── Track Tabs ───────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {activeTracks.map(track => {
          const isActive = track.id === currentSelectedTrack;
          return (
            <button
              key={track.id}
              onClick={() => setSelectedTrack(track.id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-extrabold text-[13.5px] border transition-all duration-200 ${
                isActive
                  ? "text-white shadow-lg border-transparent scale-[1.02]"
                  : "bg-card border-border text-text-muted hover:border-primary hover:text-primary"
              }`}
              style={isActive ? { background: track.color } : {}}
            >
              <span className="text-lg">{track.icon}</span>
              {track.name}
            </button>
          );
        })}
      </div>

      {/* ─── Active Track Stats Bar ────────────────────────── */}
      <div
        className="fade-up rounded-2xl p-5 text-white"
        style={{ background: `linear-gradient(135deg, ${activeTrack.color}, ${activeTrack.color}cc)` }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-black mb-0.5">
              <span>{activeTrack.icon}</span>
              {activeTrack.name}
            </div>
            <div className="text-white/70 text-sm">
              {activeTrack.sections.length} أقسام · {allSkills.length} مهارة
            </div>
          </div>

          {/* Progress circle */}
          <div className="flex items-center gap-5">
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg viewBox="0 0 64 64" className="-rotate-90 w-full h-full">
                <circle cx="32" cy="32" r="26" strokeWidth="5" fill="none" className="stroke-white/20" />
                <circle
                  cx="32" cy="32" r="26" strokeWidth="5" fill="none"
                  stroke="white" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - avgMastery / 100)}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black text-white">{avgMastery}%</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-black">{strongCount}</div>
                <div className="text-[10px] text-white/75">قوية</div>
              </div>
              <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-black">{weakCount}</div>
                <div className="text-[10px] text-white/75">ضعيفة</div>
              </div>
              <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-black">{notStarted}</div>
                <div className="text-[10px] text-white/75">لم تُبدأ</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sections of Active Track ─────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-black text-text-muted uppercase tracking-wider px-1">
          <IconTarget size={16} />
          أقسام {activeTrack.name}
        </div>

        {activeTrack.sections.map(section => (
          <SectionCard
            key={section.id}
            section={section}
            trackColor={activeTrack.color}
            sectionExams={storeExams.filter(e => e.sectionId === section.id)}
            onStartExam={examId => setState({ view: "exam", examId })}
          />
        ))}
      </div>
    </>
  );
}
