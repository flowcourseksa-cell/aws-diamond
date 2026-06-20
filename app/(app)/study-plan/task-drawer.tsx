"use client";

import { useEffect, useState } from "react";
import { IconX } from "@tabler/icons-react";
import { usePlatformStore } from "@/lib/store";

type NewTaskPayload = {
  title: string;
  due_date: string | null;
  micro_skill_id?: string | null;
};

type Props = {
  open: boolean;
  defaultDate: string; // YYYY-MM-DD
  onClose: () => void;
  onSave: (task: NewTaskPayload) => void;
};

export function TaskDrawer({ open, defaultDate, onClose, onSave }: Props) {
  const tracks = usePlatformStore(s => s.tracks);

  // Flatten all micro-skills so a task can optionally target a real skill.
  const skills = tracks.flatMap(t =>
    t.sections.flatMap(s => s.skills.map(sk => ({ id: sk.id, name: `${t.name} — ${sk.name}` })))
  );

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [skillId, setSkillId] = useState<string>("");

  useEffect(() => {
    if (open) setDate(defaultDate);
  }, [open, defaultDate]);

  const inputCls = "h-11 rounded-[10px] border border-border bg-bg px-3.5 text-[13.5px] text-text outline-none transition-colors duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(108,99,255,0.1)]";

  function handleSave() {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      due_date: date || null,
      micro_skill_id: skillId || null,
    });
    setTitle("");
    setSkillId("");
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

        {/* المهارة (اختياري) */}
        {skills.length > 0 && (
          <div className="flex flex-col gap-1.75">
            <label className="text-[13px] font-bold">المهارة المرتبطة (اختياري)</label>
            <select value={skillId} onChange={e => setSkillId(e.target.value)} className={inputCls}>
              <option value="">بدون ربط</option>
              {skills.map(sk => (
                <option key={sk.id} value={sk.id}>{sk.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* التاريخ */}
        <div className="flex flex-col gap-1.75">
          <label className="text-[13px] font-bold">تاريخ المهمة</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
        </div>

        <button onClick={handleSave}
          className="h-12 rounded-[10px] bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-dark">
          حفظ المهمة
        </button>
      </div>
    </>
  );
}
