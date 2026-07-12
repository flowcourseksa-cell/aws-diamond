// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import {
  IconChevronDown, IconChevronUp,
  IconCircleCheck, IconAlertTriangle, IconCircle,
  IconPlayerPlay, IconBrain, IconVideo, IconTarget, IconLock,
} from "@tabler/icons-react";
import { type FlowTrack, type FlowSection, type FlowSkill, usePlatformStore, type AdminExam } from "@/lib/store";
import { ExamRunner } from "@/app/(app)/exams/exam-runner";
import { TrackExamResult } from "./track-exam-result";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { submitSecureExamAttempt } from "@/app/actions/exams";
import { fetchAllExamsStatsMap } from "@/lib/supabase/services/progress";

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

import { useToast } from "@/components/ui/toast";

interface SectionCardProps {
  section: FlowSection;
  trackColor: string;
  onStartExam: (examId: string) => void;
  sectionExams: AdminExam[];
  allLessonsCompleted: boolean;
  stats?: Record<string, { bestScore: number; attemptsCount: number; maxAttempts: number }>;
}

function SectionCard({ section, trackColor, sectionExams, allLessonsCompleted, onStartExam, stats }: SectionCardProps) {
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();

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
              {sectionExams.map(exam => {
                const isLocked = !allLessonsCompleted;
                return (
                  <button
                    key={exam.id}
                    onClick={() => {
                      if (isLocked) {
                        showToast("🔒 يجب عليك مشاهدة جميع دروس هذا القسم بالكامل أولاً لفتح الاختبار!", "error");
                        return;
                      }
                      onStartExam(exam.id);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all hover:-translate-y-0.5 ${isLocked ? "bg-slate-100 text-slate-500 border-slate-200" : ""}`}
                    style={isLocked ? {} : {
                      background: `${trackColor}12`,
                      borderColor: `${trackColor}40`,
                      color: trackColor,
                    }}
                  >
                    {isLocked ? <IconLock size={16} /> : (stats && stats[exam.id]?.attemptsCount >= (stats[exam.id]?.maxAttempts ?? 5) ? <IconAlertTriangle size={16} className="text-red-500" /> : <IconPlayerPlay size={16} />)}
                    <span className={stats && stats[exam.id]?.attemptsCount >= (stats[exam.id]?.maxAttempts ?? 5) ? "text-red-500" : ""}>{exam.name}</span>
                  </button>
                );
              })}
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
  | { view: "list" };

export function TracksClient() {
  const [isMounted, setIsMounted] = useState(false);
  const storeTracks = usePlatformStore(s => s.tracks);
  const storeExams = usePlatformStore(s => s.exams);
  const storeLessons = usePlatformStore(s => s.lessons);
  const router = useRouter();
  
  useEffect(() => setIsMounted(true), []);

  const [activeTab, setActiveTab] = useState(storeTracks[0]?.id ?? "");
  const [state, setState]         = useState<ViewState>({ view: "list" });
  const [stats, setStats]         = useState<Record<string, { bestScore: number; attemptsCount: number; maxAttempts: number }>>({});
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!user) return;
    fetchAllExamsStatsMap(user.id).then(setStats);
  }, [user]);

  useEffect(() => {
    if (storeTracks.length > 0 && !activeTab) {
      setActiveTab(storeTracks[0].id);
    }
  }, [storeTracks, activeTab]);

  const isDataLoading = usePlatformStore(s => s.isDataLoading);

  const activeTrack   = storeTracks.find(t => t.id === activeTab);

  if (!isMounted || isDataLoading) return <div className="p-8 text-center text-text-muted font-bold">جاري التحميل...</div>;
  if (!activeTrack) return <div className="p-8 text-center text-text-muted font-bold">لا توجد مسارات مفعلة في هذه الدورة.</div>;

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
        {storeTracks.map(track => {
          const isActive = track.id === activeTab;
          return (
            <button
              key={track.id}
              onClick={() => setActiveTab(track.id)}
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

        {activeTrack.sections.map(section => {
          const sectionLessons = storeLessons.filter(l => l.sectionId === section.id);
          const allLessonsCompleted = sectionLessons.length === 0 || sectionLessons.every(l => l.status === "completed");

          return (
            <SectionCard
              key={section.id}
              section={section}
              trackColor={activeTrack.color}
              sectionExams={storeExams.filter(e => e.sectionId === section.id)}
              allLessonsCompleted={allLessonsCompleted}
              onStartExam={examId => {
                router.push(`/exams?pulse=${examId}`);
              }}
              stats={stats}
            />
          );
        })}
      </div>
    </>
  );
}
