"use client";

import { useEffect, useState } from "react";
import { IconX } from "@tabler/icons-react";

type Props = {
  open: boolean;
  defaultDate: string;
  onClose: () => void;
  onSave: (payload: { title: string; due_date: string }) => void;
};

export function TaskDrawer({ open, defaultDate, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [dateStr, setDateStr] = useState(defaultDate);

  // Update internal date state when defaultDate prop changes
  useEffect(() => {
    setDateStr(defaultDate);
  }, [defaultDate]);

  const inputCls = "h-11 rounded-[10px] border border-border bg-bg px-3.5 text-[13.5px] text-text outline-none transition-colors duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(108,99,255,0.1)]";

  function handleSave() {
    if (!title.trim() || !dateStr) return;
    onSave({ title: title.trim(), due_date: dateStr });
    setTitle("");
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

        {/* اليوم */}
        <div className="flex flex-col gap-1.75">
          <label className="text-[13px] font-bold">تاريخ المهمة</label>
          <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} className={inputCls} />
        </div>

        <button
          onClick={handleSave}
          className="mt-4 flex h-11 items-center justify-center rounded-[10px] bg-primary text-[14px] font-bold text-white transition-opacity hover:opacity-90"
        >
          حفظ المهمة
        </button>
      </div>
    </>
  );
}
