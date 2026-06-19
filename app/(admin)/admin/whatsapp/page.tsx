"use client";

import { useState } from "react";
import {
  IconBrandWhatsapp, IconSettings, IconSend, IconHistory,
  IconCheck, IconToggleRight, IconToggleLeft, IconUser,
} from "@tabler/icons-react";

// ── Types & Mock Data ─────────────────────────────────────────
type HistoryEntry = {
  id: string;
  date: string;
  studentName: string;
  type: string;
  status: "success" | "failed";
};

const MOCK_HISTORY: HistoryEntry[] = [];

const STUDENTS: string[] = [];

// ── Component ─────────────────────────────────────────────────
export default function AdminWhatsAppPage() {
  const [autoExam, setAutoExam] = useState(true);
  const [autoWeekly, setAutoWeekly] = useState(false);
  const [examTemplate, setExamTemplate] = useState("مرحباً ولي أمر {name}،\nلقد أكمل ابنكم اختبار في مسار {track} وحصل على نسبة {score}%.\n\nمنصة فلو تتمنى لكم التوفيق!");
  
  const [manualStudent, setManualStudent] = useState(STUDENTS[0]);
  const [manualMessage, setManualMessage] = useState("");
  const [sending, setSending] = useState(false);

  function handleSendManual() {
    if (!manualMessage.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setManualMessage("");
      alert("تم إرسال الرسالة بنجاح (وهمي)");
    }, 1000);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="fade-up rounded-2xl bg-[#25d366] px-7 py-6 text-white shadow-lg shadow-[#25d366]/20">
        <div className="flex items-center gap-3 mb-1">
          <IconBrandWhatsapp size={28} />
          <h2 className="text-xl font-black">إشعارات الواتساب لأولياء الأمور</h2>
        </div>
        <p className="text-white/80 text-sm font-semibold">إعداد الإشعارات التلقائية وإرسال رسائل يدوية للطلاب.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Settings Column */}
        <div className="flex flex-col gap-6 fade-up">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-5 text-text font-black text-lg">
              <IconSettings size={22} className="text-primary"/> الإعدادات التلقائية
            </div>
            
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-bg">
                <div>
                  <div className="font-bold text-sm text-text">رسالة بعد تسليم الاختبار</div>
                  <div className="text-xs text-text-muted mt-0.5">تُرسل تلقائياً فور انتهاء الطالب من أي اختبار.</div>
                </div>
                <button onClick={() => setAutoExam(!autoExam)} className={autoExam ? "text-[#25d366]" : "text-text-muted/50"}>
                  {autoExam ? <IconToggleRight size={36} stroke={1.5}/> : <IconToggleLeft size={36} stroke={1.5}/>}
                </button>
              </div>

              {autoExam && (
                <div className="fade-up">
                  <label className="text-xs font-black text-text-muted mb-2 block">قالب رسالة الاختبار</label>
                  <textarea value={examTemplate} onChange={e => setExamTemplate(e.target.value)} rows={4}
                    className="w-full rounded-xl border border-border bg-bg p-3 text-sm font-semibold outline-none focus:border-primary resize-none" dir="rtl"/>
                  <div className="flex gap-2 mt-2">
                    {["{name}", "{score}", "{track}"].map(tag => (
                      <button key={tag} onClick={() => setExamTemplate(t => t + " " + tag)}
                        className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-xs font-bold hover:bg-primary/20">
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-bg">
                <div>
                  <div className="font-bold text-sm text-text">التقرير الأسبوعي الشامل</div>
                  <div className="text-xs text-text-muted mt-0.5">يُرسل كل يوم جمعة بملخص أداء الطالب.</div>
                </div>
                <button onClick={() => setAutoWeekly(!autoWeekly)} className={autoWeekly ? "text-[#25d366]" : "text-text-muted/50"}>
                  {autoWeekly ? <IconToggleRight size={36} stroke={1.5}/> : <IconToggleLeft size={36} stroke={1.5}/>}
                </button>
              </div>
              
              <button className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-dark">
                <IconCheck size={18}/> حفظ الإعدادات
              </button>
            </div>
          </div>
        </div>

        {/* Manual Send & History Column */}
        <div className="flex flex-col gap-6 fade-up delay-1">
          
          {/* Manual Send */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-5 text-text font-black text-lg">
              <IconSend size={20} className="text-accent-amber"/> إرسال رسالة يدوية
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-black text-text-muted mb-1.5 block">الطالب</label>
                <div className="relative">
                  <IconUser size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"/>
                  <select value={manualStudent} onChange={e => setManualStudent(e.target.value)}
                    className="w-full rounded-xl border border-border bg-bg py-2.5 pl-3 pr-10 text-sm font-semibold outline-none focus:border-primary">
                    {STUDENTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-text-muted mb-1.5 block">محتوى الرسالة</label>
                <textarea value={manualMessage} onChange={e => setManualMessage(e.target.value)} rows={3} placeholder="اكتب رسالتك هنا..."
                  className="w-full rounded-xl border border-border bg-bg p-3 text-sm font-semibold outline-none focus:border-primary resize-none"/>
              </div>
              <button onClick={handleSendManual} disabled={!manualMessage.trim() || sending}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#25d366] px-4 py-3 text-sm font-bold text-white hover:bg-[#20bd5a] disabled:opacity-50">
                {sending ? "جاري الإرسال..." : <><IconBrandWhatsapp size={18}/> إرسال الآن</>}
              </button>
            </div>
          </div>

          {/* History */}
          <div className="rounded-2xl border border-border bg-card p-6 flex-1">
            <div className="flex items-center gap-2 mb-4 text-text font-black text-lg">
              <IconHistory size={20} className="text-text-muted"/> سجل الإرسال
            </div>
            
            <div className="flex flex-col gap-3">
              {MOCK_HISTORY.map(h => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-bg">
                  <div>
                    <div className="font-bold text-sm text-text">{h.studentName}</div>
                    <div className="text-xs text-text-muted font-semibold mt-0.5">{h.type} • {h.date}</div>
                  </div>
                  {h.status === "success" 
                    ? <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded-lg text-[10px] font-black">نجاح</span>
                    : <span className="bg-rose-50 text-rose-600 border border-rose-200 px-2 py-1 rounded-lg text-[10px] font-black">فشل</span>
                  }
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
