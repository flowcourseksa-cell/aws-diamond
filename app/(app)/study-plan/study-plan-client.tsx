"use client";

import { useMemo, useState } from "react";
import { IconCheck, IconListCheck } from "@tabler/icons-react";
import { FLOW_TRACKS, MOCK_CENTER_ID } from "@/lib/mock-data";
import type { StudyTask } from "@/lib/types";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useToast } from "@/components/ui/toast";
import { TaskDrawer } from "./task-drawer";
import { usePlatformStore } from "@/lib/store";
import { useEffect } from "react";

const DAYS_NAMES = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const DAYS_DATES = ["12 يونيو", "13 يونيو", "14 يونيو", "15 يونيو", "16 يونيو"];
const TODAY_INDEX = 3; // الأربعاء

const PRIORITY_COLORS: Record<StudyTask["priority"], string> = {
  high:   "var(--accent-red)",
  medium: "var(--accent-amber)",
  low:    "var(--accent-teal)",
};

type FlowTask = StudyTask & { trackId: string };

const INITIAL_TASKS: FlowTask[] = [
  { id: "t1",  centerId: MOCK_CENTER_ID, trackId: "qudrat-komi",  title: "مراجعة المعادلات الخطية",        subjectId: 0, time: "09:00", day: 3, priority: "high",   isDone: true  },
  { id: "t2",  centerId: MOCK_CENTER_ID, trackId: "qudrat-lafzi", title: "حل 15 سؤال مفردة شاذة",          subjectId: 0, time: "11:00", day: 3, priority: "medium", isDone: true  },
  { id: "t3",  centerId: MOCK_CENTER_ID, trackId: "qudrat-komi",  title: "تمارين الاحتمالات — مهارة ضعيفة", subjectId: 0, time: "14:00", day: 3, priority: "high",   isDone: false },
  { id: "t4",  centerId: MOCK_CENTER_ID, trackId: "qudrat-lafzi", title: "مراجعة الاستنتاج في المقروء",     subjectId: 0, time: "16:00", day: 3, priority: "medium", isDone: false },
  { id: "t5",  centerId: MOCK_CENTER_ID, trackId: "tasis",   title: "الكسور والنسب المئوية — تأسيس",  subjectId: 0, time: "18:00", day: 3, priority: "low",    isDone: false },

  { id: "t6",  centerId: MOCK_CENTER_ID, trackId: "qudrat-komi",  title: "اختبار جبر تجريبي سابق",         subjectId: 0, time: "10:00", day: 0, priority: "high",   isDone: true  },
  { id: "t7",  centerId: MOCK_CENTER_ID, trackId: "qudrat-lafzi", title: "شرح التناظر اللفظي",              subjectId: 0, time: "12:00", day: 0, priority: "medium", isDone: false },

  { id: "t8",  centerId: MOCK_CENTER_ID, trackId: "qudrat-komi",  title: "مراجعة الهندسة — الزوايا",       subjectId: 0, time: "09:30", day: 1, priority: "medium", isDone: true  },
  { id: "t9",  centerId: MOCK_CENTER_ID, trackId: "qudrat-lafzi", title: "قراءة فقرة واستخراج الفكرة",     subjectId: 0, time: "13:00", day: 1, priority: "low",    isDone: true  },
  { id: "t10", centerId: MOCK_CENTER_ID, trackId: "tasis",  title: "مراجعة أنواع الجمل — تأسيس",     subjectId: 0, time: "17:00", day: 1, priority: "high",   isDone: false },

  { id: "t11", centerId: MOCK_CENTER_ID, trackId: "qudrat-komi",  title: "حل تمارين الإحصاء",              subjectId: 0, time: "09:00", day: 2, priority: "high",   isDone: false },
  { id: "t12", centerId: MOCK_CENTER_ID, trackId: "qudrat-lafzi", title: "تدريب إكمال الجمل",              subjectId: 0, time: "15:00", day: 2, priority: "medium", isDone: false },

  { id: "t13", centerId: MOCK_CENTER_ID, trackId: "qudrat-komi",  title: "مراجعة شاملة كمي",               subjectId: 0, time: "10:00", day: 4, priority: "high",   isDone: false },
  { id: "t14", centerId: MOCK_CENTER_ID, trackId: "qudrat-lafzi", title: "اختبار تجريبي لفظي",             subjectId: 0, time: "13:00", day: 4, priority: "medium", isDone: false },
  { id: "t15", centerId: MOCK_CENTER_ID, trackId: "tasis",   title: "تمارين المحيط والمساحة",         subjectId: 0, time: "16:00", day: 4, priority: "low",    isDone: false },
];

export function StudyPlanClient() {
  const [isMounted, setIsMounted] = useState(false);
  const storeTracks = usePlatformStore(s => s.tracks);
  
  useEffect(() => setIsMounted(true), []);

  const [tasks, setTasks] = useState<FlowTask[]>(INITIAL_TASKS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDay, setDrawerDay] = useState(TODAY_INDEX);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const { showToast } = useToast();

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.isDone).length;
    const remain = total - done;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, remain, pct };
  }, [tasks]);

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, isDone: !t.isDone };
        if (updated.isDone) showToast("أحسنت! تم إنجاز المهمة", "success");
        return updated;
      })
    );
  }

  function moveTask(id: string, newDay: number) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, day: newDay } : t)));
    showToast("تم نقل المهمة بنجاح", "success");
  }

  function addTask(task: Omit<StudyTask, "id" | "isDone" | "centerId">) {
    const newTask: FlowTask = {
      ...task,
      trackId:  (task as Partial<FlowTask>).trackId ?? "qudrat-komi",
      id:       `t${Date.now()}`,
      centerId: MOCK_CENTER_ID,
      isDone:   false,
    };
    setTasks(prev => [...prev, newTask]);
    setDrawerOpen(false);
    showToast("تمت إضافة المهمة بنجاح", "success");
  }

  function openDrawer(day: number) {
    setDrawerDay(day);
    setDrawerOpen(true);
  }

  const todayTasks = tasks.filter((t) => t.day === TODAY_INDEX);

  if (!isMounted) return <div className="p-8 text-center text-text-muted font-bold">جاري التحميل...</div>;

  return (
    <>
      {/* إحصائيات سريعة */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="fade-up flex items-center gap-3.5 rounded-2xl border border-border bg-card px-5 py-4.5">
          <div className="flex h-11.5 w-11.5 flex-shrink-0 items-center justify-center rounded-xl bg-primary-light text-[21px] text-primary">
            <IconListCheck size={21} />
          </div>
          <div>
            <div className="text-[22px] font-black">{stats.total}</div>
            <div className="text-[12.5px] font-semibold text-text-muted">إجمالي المهام هذا الأسبوع</div>
          </div>
        </div>

        <div className="fade-up delay-1 flex items-center gap-3.5 rounded-2xl border border-border bg-card px-5 py-4.5">
          <div className="flex h-11.5 w-11.5 flex-shrink-0 items-center justify-center rounded-xl bg-accent-teal-light text-[21px] text-accent-teal">
            <IconCheck size={21} />
          </div>
          <div>
            <div className="text-[22px] font-black">
              {stats.done} / {stats.remain}
            </div>
            <div className="text-[12.5px] font-semibold text-text-muted">مكتملة / متبقية</div>
          </div>
        </div>

        <div className="fade-up delay-2 flex flex-col gap-2 rounded-2xl border border-border bg-card px-5 py-4.5">
          <div className="flex items-center justify-between">
            <div className="text-[12.5px] font-semibold text-text-muted">نسبة الإنجاز</div>
            <div className="text-base font-black">{stats.pct}%</div>
          </div>
          <ProgressBar percent={stats.pct} color="var(--accent-teal)" />
        </div>
      </section>

      {/* التقويم الأسبوعي */}
      <section className="fade-up rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-base font-extrabold">
          الخطة الأسبوعية
          <button onClick={() => openDrawer(TODAY_INDEX)} className="text-[12.5px] font-bold text-primary">
            + إضافة مهمة جديدة
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <div className="rounded-[10px] bg-primary px-4.5 py-2.25 text-[13px] font-bold text-white">
            هذا الأسبوع (12 - 16 يونيو)
          </div>
          <div className="cursor-pointer rounded-[10px] border border-border px-4.5 py-2.25 text-[13px] font-bold text-text-muted transition-colors duration-200 hover:border-primary hover:text-primary">
            الأسبوع القادم
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
          {DAYS_NAMES.map((name, dayIdx) => {
            const dayTasks = tasks.filter((t) => t.day === dayIdx);
            const isToday = dayIdx === TODAY_INDEX;
            const isDragOver = dragOverDay === dayIdx;

            return (
              <div
                key={name}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverDay(dayIdx);
                }}
                onDragLeave={() => setDragOverDay((cur) => (cur === dayIdx ? null : cur))}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) moveTask(id, dayIdx);
                  setDragOverDay(null);
                }}
                className={`flex min-h-85 flex-col gap-2.5 rounded-2xl border p-3.5 transition-colors duration-200 ${
                  isDragOver ? "border-primary bg-primary-light" : "border-border"
                }`}
              >
                <div className="mb-1 border-b border-border pb-2.5 text-center">
                  <div className="text-sm font-extrabold">
                    {name}
                    {isToday ? " (اليوم)" : ""}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-text-muted">{DAYS_DATES[dayIdx]}</div>
                </div>

                {dayTasks.length === 0 ? (
                  <div className="flex min-h-20 flex-1 items-center justify-center rounded-[10px] border border-dashed border-border text-xs text-text-muted">
                    لا توجد مهام
                  </div>
                ) : (
                  dayTasks.map((task) => {
                    const track = storeTracks.find(t => t.id === task.trackId) ?? { color: "#6366f1", name: "مسار محذوف" };
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData("text/plain", task.id); }}
                        className={`relative cursor-grab rounded-[10px] p-2.5 transition-opacity duration-200 active:cursor-grabbing ${
                          task.isDone ? "opacity-50 line-through" : ""
                        }`}
                        style={{ background: `${track.color}18`, color: track.color }}
                      >
                        <span className="absolute right-2 top-2 h-1.75 w-1.75 rounded-full" style={{ background: PRIORITY_COLORS[task.priority] }} />
                        <div className="mb-0.75 text-[11px] font-bold opacity-70">{task.time} · {track.name}</div>
                        <div className="text-[12.5px] font-bold">{task.title}</div>
                        <button
                          onClick={() => toggleTask(task.id)}
                          aria-label={task.isDone ? "إلغاء إنجاز المهمة" : "إنجاز المهمة"}
                          className={`absolute bottom-2 left-2 flex h-4.5 w-4.5 items-center justify-center rounded-[6px] border-2 text-[11px] opacity-60 transition-opacity duration-200 ${
                            task.isDone ? "border-current bg-current opacity-100" : "border-current"
                          }`}
                        >
                          {task.isDone && <IconCheck size={11} style={{ color: "var(--card)" }} />}
                        </button>
                      </div>
                    );
                  })
                )}

                <button
                  onClick={() => openDrawer(dayIdx)}
                  className="rounded-[10px] border border-dashed border-border py-2.25 text-[12.5px] font-bold text-text-muted transition-colors duration-200 hover:border-primary hover:text-primary"
                >
                  + إضافة مهمة
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* الوضع اليومي */}
      <section className="fade-up rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 text-base font-extrabold">مهام اليوم — الأربعاء</div>
        {todayTasks.length === 0 ? (
          <div className="flex min-h-20 items-center justify-center rounded-[10px] border border-dashed border-border text-xs text-text-muted">
            لا توجد مهام اليوم 🎉
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {todayTasks.map((task) => {
              const track = storeTracks.find(t => t.id === task.trackId) ?? { color: "#6366f1", name: "مسار محذوف" };
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 rounded-xl border border-border px-3.5 py-3.25 transition-colors duration-200 hover:border-primary ${
                    task.isDone ? "opacity-55" : ""
                  }`}
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    aria-label={task.isDone ? "إلغاء إنجاز المهمة" : "إنجاز المهمة"}
                    className={`pop flex h-5.5 w-5.5 flex-shrink-0 items-center justify-center rounded-[7px] border-2 text-[13px] transition-colors duration-200 ${
                      task.isDone ? "border-accent-teal bg-accent-teal text-white" : "border-border text-transparent"
                    }`}
                  >
                    <IconCheck size={14} />
                  </button>
                  <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: track.color }} />
                  <span className={`flex-1 text-[13.5px] font-semibold ${task.isDone ? "line-through" : ""}`}>
                    {task.title}
                  </span>
                  <span className="text-xs font-semibold text-text-muted">{task.time}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <TaskDrawer
        open={drawerOpen}
        defaultDay={drawerDay}
        onClose={() => setDrawerOpen(false)}
        onSave={addTask}
      />
    </>
  );
}
