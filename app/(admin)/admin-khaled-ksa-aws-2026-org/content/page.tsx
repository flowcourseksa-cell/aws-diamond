"use client";

import { useState, useEffect } from "react";
import { IconUpload, IconVideo, IconFileTypePdf, IconCheck } from "@tabler/icons-react";
import { usePlatformStore } from "@/lib/store";
import { useToast } from "@/components/ui/toast";

type AccessType = "free" | "paid";

function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.75">
      <label className="text-[13px] font-bold">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "h-11 rounded-[10px] border border-border bg-bg px-3.5 text-[13.5px] text-text outline-none transition-colors focus:border-primary focus:shadow-[0_0_0_3px_rgba(108,99,255,0.1)]";

function AccessToggle({ value, onChange }: { value: AccessType; onChange: (v: AccessType) => void }) {
  return (
    <div className="flex gap-2">
      {(["free", "paid"] as AccessType[]).map(v => (
        <button key={v} onClick={() => onChange(v)} type="button"
          className={`flex-1 rounded-[10px] border py-2.5 text-[13px] font-bold transition-colors ${value === v
            ? v === "free" ? "border-accent-teal bg-accent-teal-light text-accent-teal" : "border-accent-amber bg-accent-amber-light text-accent-amber"
            : "border-border text-text-muted hover:border-primary hover:text-primary"}`}>
          {v === "free" ? "🆓 مجاني" : "💰 مدفوع"}
        </button>
      ))}
    </div>
  );
}

export default function ContentPage() {
  const { showToast } = useToast();
  const { tracks } = usePlatformStore();

  const [lesson, setLesson] = useState({ title: "", subjectId: tracks[0]?.id || "0", videoUrl: "", order: "", access: "free" as AccessType, price: "" });
  const [file, setFile] = useState({ title: "", subjectId: tracks[0]?.id || "0", type: "pdf", access: "free" as AccessType, price: "" });

  function submitLesson() {
    if (!lesson.title || !lesson.videoUrl) { showToast("الرجاء تعبئة اسم الدرس ورابط الفيديو", "error"); return; }
    showToast("تم رفع الدرس بنجاح ✅", "success");
    setLesson({ title: "", subjectId: tracks[0]?.id || "0", videoUrl: "", order: "", access: "free", price: "" });
  }

  function submitFile() {
    if (!file.title) { showToast("الرجاء تعبئة اسم الملف", "error"); return; }
    showToast("تم رفع الملف بنجاح ✅", "success");
    setFile({ title: "", subjectId: tracks[0]?.id || "0", type: "pdf", access: "free", price: "" });
  }

  return (
    <>
      {/* رفع درس */}
      <section className="fade-up rounded-2xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-2.5 text-base font-extrabold">
          <IconVideo size={20} className="text-primary" /> رفع درس جديد
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormGroup label="اسم الدرس">
            <input className={inputCls} value={lesson.title} onChange={e => setLesson(p => ({ ...p, title: e.target.value }))} placeholder="مثال: التفاضل والتكامل — الجزء الثاني" />
          </FormGroup>
          <FormGroup label="المسار">
            <select className={inputCls} value={lesson.subjectId} onChange={e => setLesson(p => ({ ...p, subjectId: e.target.value }))}>
              {tracks.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="رابط الفيديو">
            <input className={inputCls} value={lesson.videoUrl} onChange={e => setLesson(p => ({ ...p, videoUrl: e.target.value }))} placeholder="https://..." />
          </FormGroup>
          <FormGroup label="ترتيب الدرس">
            <input className={inputCls} type="number" min="1" value={lesson.order} onChange={e => setLesson(p => ({ ...p, order: e.target.value }))} placeholder="مثال: 3" />
          </FormGroup>
          <FormGroup label="نوع الوصول">
            <AccessToggle value={lesson.access} onChange={v => setLesson(p => ({ ...p, access: v, price: "" }))} />
          </FormGroup>
          {lesson.access === "paid" && (
            <FormGroup label="السعر (ر.س)">
              <input className={inputCls} type="number" min="1" value={lesson.price} onChange={e => setLesson(p => ({ ...p, price: e.target.value }))} placeholder="مثال: 39" />
            </FormGroup>
          )}
        </div>
        <button onClick={submitLesson} className="mt-5 flex items-center gap-2 rounded-[10px] bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark">
          <IconUpload size={16} /> رفع الدرس
        </button>
      </section>

      {/* رفع ملف */}
      <section className="fade-up delay-1 rounded-2xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-2.5 text-base font-extrabold">
          <IconFileTypePdf size={20} className="text-accent-red" /> رفع ملف للمكتبة
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormGroup label="اسم الملف">
            <input className={inputCls} value={file.title} onChange={e => setFile(p => ({ ...p, title: e.target.value }))} placeholder="مثال: ملخص قوانين الفيزياء" />
          </FormGroup>
          <FormGroup label="المسار">
            <select className={inputCls} value={file.subjectId} onChange={e => setFile(p => ({ ...p, subjectId: e.target.value }))}>
              {tracks.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="نوع الملف">
            <select className={inputCls} value={file.type} onChange={e => setFile(p => ({ ...p, type: e.target.value }))}>
              {[["pdf","PDF"],["video","فيديو"],["image","صورة"],["summary","ملخص"]].map(([v,l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </FormGroup>
          <FormGroup label="الملف">
            <input type="file" className="h-11 rounded-[10px] border border-border bg-bg px-3.5 pt-2.5 text-[13px] text-text-muted file:ml-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-bold file:text-white" />
          </FormGroup>
          <FormGroup label="نوع الوصول">
            <AccessToggle value={file.access} onChange={v => setFile(p => ({ ...p, access: v, price: "" }))} />
          </FormGroup>
          {file.access === "paid" && (
            <FormGroup label="السعر (ر.س)">
              <input className={inputCls} type="number" min="1" value={file.price} onChange={e => setFile(p => ({ ...p, price: e.target.value }))} placeholder="مثال: 19" />
            </FormGroup>
          )}
        </div>
        <button onClick={submitFile} className="mt-5 flex items-center gap-2 rounded-[10px] bg-accent-red px-6 py-3 text-sm font-bold text-white transition-colors hover:opacity-90">
          <IconUpload size={16} /> رفع الملف
        </button>
      </section>
    </>
  );
}

