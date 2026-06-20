"use client";

import { useState, useEffect } from "react";
import { IconX } from "@tabler/icons-react";
import { usePlatformStore } from "@/lib/store";
import type { StudyTask } from "@/lib/types";

const DAY_OPTIONS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];

const PRIORITY_OPTIONS: { value: StudyTask["priority"]; label: string }[] = [
  { value: "high",   label: "عالي" },
  { value: "medium", label: "متوسط" },
  { value: "low",    label: "منخفض" },
];

const PRIORITY_ACTIVE: Record<StudyTask["priority"], string> = {
  high:   "border-accent-red bg-accent-red-light text-accent-red",
  medium: "border-accent-amber bg-accent-amber-light text-accent-amber",
  low:    "border-accent-teal bg-accent-teal-light text-accent-teal",
};

type Props = {
  open: boolean;
  defaultDay: number;
  onClose: () => void;
  onSave: (task: Omit<StudyTask, "id" | "isDone" | "centerId">) => void;
};

export function TaskDrawer({ open, defaultDay, onClose, onSave }: Props) {
  const { tracks } = usePlatformStore();
  
  const [title,     setTitle]    = useState("");
  const [trackId,   setTrackId]  = useState(tracks[0]?.id || "");
  const [day,       setDay]      = useState(defaultDay);
  const [time,      setTime]     = useState("10:00");
  const [priority,  setPriority] = useState<StudyTask["priority"]>("medium");

  const inputCls = "h-11 rounded-[10px] border border-border bg-bg px-3.5 text-[13.5px] text-text outline-none transition-colors duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(108,99,255,0.1)]";

  function handleSave() {
    if (!title.trim()) return;
    // نستخدم subjectId=0 كـ placeholder — سيُستبدل بـ trackId مع Supabase
    onSave({ title: title.trim(), subjectId: 0, day, time, priority });
    setTitle("");
    setPriority("medium");
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-60 bg-[rgba(15,17,23,0.4)] transition-opacity duration-250 ${open ? "visible opacity-100" : "invisible opacity-0"}`}
        onClick={onClose} aria-hidden="true"
      />
      <div
        className={`fixed left-0 top-0 z-61 flex h-screen w-95 max-w-[90vw] flex-col gap-4 overflow-y-auto bg-card p-6 transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold">إضافة مهمة جديدة</h3>
          <button onClick={onClose} className="flex h-8.5 w-8.5 items-center justify-center rounded-[10px] border border-border bg-bg" aria-label="إغلاق">
            <IconX size={18} />
          </button>
        </div>

        {/* اسم المهمة */}
        <div className="flex flex-col gap-1.75">
          <label className="text-[13px] font-bold">اسم المهمة</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="مثال: مراجعة مسائل الاحتمالات"
            className={inputCls} />
        </div>

        {/* المسار */}
        <div className="flex flex-col gap-1.75">
          <label className="text-[13px] font-bold">المسار</label>
          <select value={trackId} onChange={e => setTrackId(e.target.value)} className={inputCls}>
            {tracks.map(t => (
              <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
            ))}
          </select>
        </div>

        {/* اليوم */}
        <div className="flex flex-col gap-1.75">
          <label className="text-[13px] font-bold">اليوم</label>
          <select value={day} onChange={e => setDay(Number(e.target.value))} className={inputCls}>
            {DAY_OPTIONS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </div>

        {/* الوقت */}
        <div className="flex flex-col gap-1.75">
          <label className="text-[13px] font-bold">الوقت</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls} />
        </div>

        {/* الأولوية */}
        <div className="flex flex-col gap-1.75">
          <label className="text-[13px] font-bold">الأولوية</label>
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => setPriority(opt.value)}
                className={`flex-1 rounded-[10px] border px-2.5 py-2.5 text-center text-[12.5px] font-bold transition-colors duration-200 ${priority === opt.value ? PRIORITY_ACTIVE[opt.value] : "border-border text-text-muted"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave}
          className="h-12 rounded-[10px] bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-dark">
          حفظ المهمة
        </button>
      </div>
    </>
  );
}

