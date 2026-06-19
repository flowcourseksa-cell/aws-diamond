"use client";

import { useState, useRef, useEffect } from "react";
import {
  IconSearch, IconPlayerPlay, IconPlayerPause, IconCheck,
  IconLock, IconArrowRight, IconVideo, IconUser, IconBrain,
} from "@tabler/icons-react";
import { CURRENT_SUBSCRIPTION } from "@/lib/mock-data";
import { useToast } from "@/components/ui/toast";
import { ProgressBar } from "@/components/ui/progress-bar";
import { usePlatformStore, type AdminLesson } from "@/lib/store";
import { useRouter } from "next/navigation";
import { IconAlertTriangle } from "@tabler/icons-react";

// ── بيانات الدروس مرتبطة بالمسارات الصحيحة ────────────────

type TrackLesson = {
  id: string;
  trackId: string;
  trackName: string;
  trackColor: string;
  sectionName: string;
  title: string;
  teacherName: string;
  durationLabel: string;
  progressPercent: number;
  status: "" | "new" | "done";
  accessType: "free" | "paid";
  price: number;
};
// ── Video Player ─────────────────────────────────────────────
function VideoPlayer({ lesson, onBack, onComplete }: {
  lesson: TrackLesson;
  onBack: () => void;
  onComplete: () => void;
}) {
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(lesson.progressPercent);
  const [completed, setCompleted] = useState(lesson.status === "done");
  const { showToast } = useToast();
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      ref.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { setPlaying(false); clearInterval(ref.current!); return 100; }
          return p + 1;
        });
      }, 200);
    } else { if (ref.current) clearInterval(ref.current); }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [playing]);

  return (
    <div>
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-[13.5px] font-bold text-text-muted hover:text-primary">
        <IconArrowRight size={18} /> العودة لقائمة الدروس
      </button>

      <div className="overflow-hidden rounded-2xl bg-[#0A0A0F]">
        <div className="relative flex h-[300px] items-center justify-center sm:h-[360px]"
          style={{ background: `linear-gradient(135deg,${lesson.trackColor}33,#0A0A0F)` }}>
          <IconVideo size={64} className="text-white opacity-10" />
          <button onClick={() => setPlaying(p => !p)}
            className="absolute flex h-18 w-18 items-center justify-center rounded-full bg-white/15 text-white transition-all hover:scale-105 hover:bg-white/25">
            {playing ? <IconPlayerPause size={30} /> : <IconPlayerPlay size={30} />}
          </button>
          {playing && <div className="absolute bottom-3 left-3 rounded-lg bg-black/50 px-2.5 py-1 text-xs font-bold text-white">يتم التشغيل...</div>}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <span className="rounded-lg px-3 py-1 text-xs font-bold text-white" style={{ background: lesson.trackColor }}>
              {lesson.trackName}
            </span>
            <span className="rounded-lg bg-black/50 px-2.5 py-1 text-xs font-bold text-white">{lesson.sectionName}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-[#0F1117] px-4 py-3">
          <button onClick={() => setPlaying(p => !p)} className="text-white hover:text-primary">
            {playing ? <IconPlayerPause size={20} /> : <IconPlayerPlay size={20} />}
          </button>
          <div className="flex-1"><ProgressBar percent={progress} color={lesson.trackColor} /></div>
          <span className="text-xs font-bold text-white/60">{lesson.durationLabel}</span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: lesson.trackColor }}>{lesson.sectionName}</span>
        </div>
        <h2 className="my-2 text-lg font-extrabold">{lesson.title}</h2>
        <div className="mb-5 flex items-center gap-2 text-[12.5px] text-text-muted"><IconUser size={15} />{lesson.teacherName}</div>
        <button
          onClick={() => { setCompleted(true); setProgress(100); onComplete(); showToast("تم إكمال الدرس ✅", "success"); }}
          disabled={completed}
          className={`mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] text-sm font-extrabold transition-colors ${completed ? "bg-accent-teal text-white" : "bg-accent-teal-light text-accent-teal hover:bg-accent-teal hover:text-white"}`}>
          <IconCheck size={18} />{completed ? "تم إكمال الدرس" : "ضع علامة كمكتمل"}
        </button>
        <div className="text-sm font-bold mb-2">ملاحظاتي</div>
        <textarea rows={3} placeholder="اكتب ملاحظاتك هنا..." className="w-full resize-none rounded-[10px] border border-border bg-bg p-3.5 text-[13.5px] text-text outline-none focus:border-primary" />
        <button onClick={() => showToast("تم حفظ ملاحظاتك", "success")} className="mt-2.5 h-10 rounded-[10px] bg-primary px-5 text-sm font-bold text-white hover:bg-primary-dark">حفظ</button>
      </div>
    </div>
  );
}

export default function LessonsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { lessons, tracks: storeTracks, enrolledCourseId, courses } = usePlatformStore();
  
  useEffect(() => setIsMounted(true), []);

  const [filter, setFilter]       = useState("all");
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState<TrackLesson | null>(null);
  const [done, setDone]           = useState<Set<string>>(new Set());
  const { showToast }             = useToast();
  const hasSub = true; // In the real system, they have a sub if they are enrolled

  if (!isMounted) return <div className="p-8 text-center font-bold">جاري التحميل...</div>;

  const currentCourse = courses.find(c => c.id === enrolledCourseId);

  if (!enrolledCourseId || !currentCourse) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center bg-card rounded-2xl border border-border mt-10 shadow-lg" dir="rtl">
        <IconAlertTriangle size={64} className="text-amber-500 mb-4" />
        <h2 className="text-2xl font-black mb-3">أنت غير مشترك في أي دورة حالياً</h2>
        <p className="text-text-muted font-medium mb-6">يرجى الاشتراك في دورة للوصول إلى الدروس والشروحات.</p>
        <button onClick={() => router.push("/#courses")} className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-colors">
          تصفح الدورات المتاحة
        </button>
      </div>
    );
  }

  const activeTracks = storeTracks.filter(t => currentCourse.trackIds.includes(t.id));
  const activeLessons = lessons.filter(l => currentCourse.trackIds.includes(l.trackId));

  const mappedLessons: TrackLesson[] = activeLessons.map(l => {
    const track = activeTracks.find(t => t.id === l.trackId);
    const section = track?.sections.find(s => s.id === l.sectionId);
    return {
      id: l.id,
      trackId: l.trackId,
      trackName: track?.name ?? "مسار محذوف",
      trackColor: track?.color ?? "#888",
      sectionName: section?.name ?? "قسم محذوف",
      title: l.title,
      teacherName: l.teacherName,
      durationLabel: l.durationLabel,
      progressPercent: 0,
      status: l.status === "completed" ? "done" : l.status === "new" ? "new" : "",
      accessType: l.accessType,
      price: l.price,
    };
  });

  const filtered = mappedLessons.filter(l => {
    const mf = filter === "all" || l.trackId === filter;
    const ms = l.title.includes(search) || l.sectionName.includes(search) || l.teacherName.includes(search);
    return mf && ms;
  });

  const trackFilters = [
    { value: "all", label: "كل المسارات" },
    ...activeTracks.map(t => ({ value: t.id, label: t.name }))
  ];

  function open(l: TrackLesson) {
    if (l.accessType === "paid" && !hasSub) {
      showToast(`هذا الدرس مدفوع (${l.price} ر.س) — اشترك للوصول`, "warning");
      return;
    }
    setSelected(l);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!isMounted) return <div className="p-8 text-center text-text-muted font-bold">جاري التحميل...</div>;

  if (selected) {
    return (
      <VideoPlayer
        lesson={selected}
        onBack={() => setSelected(null)}
        onComplete={() => setDone(p => new Set([...p, selected.id]))}
      />
    );
  }

  return (
    <>
      {/* Header */}
      <section className="fade-up rounded-2xl bg-sidebar px-7 py-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <IconVideo size={26} />
          <h2 className="text-xl font-black">الدروس والشروحات</h2>
        </div>
        <p className="text-white/55 text-sm">شروحات مرتبطة بكل مسار وقسم — ابدأ من أي نقطة</p>
      </section>

      {/* Filters + Search */}
      <section className="fade-up flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setFilter("all")}
            className={`flex-shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${filter === "all" ? "bg-text text-bg shadow-lg scale-[1.02]" : "border border-border text-text-muted hover:border-text-muted"}`}
          >
            كل الدروس
          </button>
          {activeTracks.map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`flex-shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${filter === t.id ? "bg-text text-bg shadow-lg scale-[1.02]" : "border border-border text-text-muted hover:border-text-muted"}`}
            >
              {t.name}
            </button>
          ))}
        </div>
        <div className="relative min-w-[220px]">
          <IconSearch size={17} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث عن درس أو قسم..."
            className="h-10.5 w-full rounded-[10px] border border-border bg-card pr-10 pl-4 text-[13.5px] text-text outline-none focus:border-primary" />
        </div>
      </section>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-text-muted">
          لا توجد دروس مطابقة
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l, i) => {
            const isDone  = done.has(l.id) || l.status === "done";
            const locked  = l.accessType === "paid" && !hasSub;
            return (
              <div key={l.id} onClick={() => open(l)}
                className={`fade-up delay-${(i % 4) + 1} flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.75 hover:shadow-lg`}>
                {/* Thumbnail */}
                <div className="relative flex h-36 items-center justify-center" style={{ background: `${l.trackColor}18` }}>
                  <IconPlayerPlay size={38} style={{ color: l.trackColor }} className="opacity-80" />
                  {isDone && <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-lg bg-accent-teal px-2.5 py-1 text-[10.5px] font-extrabold text-white"><IconCheck size={12} />مكتمل</div>}
                  {!isDone && l.status === "new" && <div className="absolute right-2.5 top-2.5 rounded-lg bg-accent-red px-2.5 py-1 text-[10.5px] font-extrabold text-white">جديد</div>}
                  {locked && <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-lg bg-accent-amber px-2.5 py-1 text-[10.5px] font-extrabold text-white"><IconLock size={12} />{l.price} ر.س</div>}
                  <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-black/60 px-2 py-0.75 text-[11px] font-bold text-white">{l.durationLabel}</div>
                  {/* Track badge */}
                  <div className="absolute bottom-2.5 right-2.5 rounded-lg px-2 py-0.75 text-[10px] font-bold text-white" style={{ background: l.trackColor }}>
                    {l.sectionName}
                  </div>
                </div>
                {/* Info */}
                <div className="flex flex-1 flex-col gap-2.5 p-4">
                  <div className="text-[14.5px] font-extrabold leading-tight">{l.title}</div>
                  <div className="text-[11.5px] font-bold" style={{ color: l.trackColor }}>{l.trackName}</div>
                  <div className="flex items-center gap-2 text-[12px] text-text-muted"><IconUser size={13} />{l.teacherName}</div>
                  <div>
                    <div className="mb-1.5 flex justify-between text-[11.5px] font-bold text-text-muted">
                      <span>تقدمك</span><span>{isDone ? 100 : l.progressPercent}%</span>
                    </div>
                    <ProgressBar percent={isDone ? 100 : l.progressPercent} color={l.trackColor} />
                  </div>
                  <button onClick={e => { e.stopPropagation(); open(l); }}
                    className={`mt-auto h-10 rounded-[10px] text-[13px] font-bold transition-colors ${locked ? "bg-accent-amber-light text-accent-amber hover:bg-accent-amber hover:text-white" : isDone ? "bg-accent-teal-light text-accent-teal" : "bg-primary text-white hover:bg-primary-dark"}`}>
                    {locked ? `مدفوع — ${l.price} ر.س` : isDone ? "مراجعة الدرس" : l.progressPercent > 0 ? "متابعة المشاهدة" : "ابدأ الآن"}
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </>
  );
}
