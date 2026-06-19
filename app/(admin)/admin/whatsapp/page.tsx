"use client";

import { useState, useEffect } from "react";
import {
  IconBrandWhatsapp, IconSettings, IconSend, IconHistory,
  IconCheck, IconToggleRight, IconToggleLeft, IconUser,
} from "@tabler/icons-react";
import { usePlatformStore } from "@/lib/store";
import { useToast } from "@/components/ui/toast";

export default function AdminWhatsAppPage() {
  const [autoExam, setAutoExam] = useState(true);
  const [autoWeekly, setAutoWeekly] = useState(false);
  const [examTemplate, setExamTemplate] = useState(
    "مرحباً ولي أمر {name}،\nلقد أكمل ابنكم اختبار في مسار {track} وحصل على نسبة {score}%.\n\nمنصة فلو تتمنى لكم التوفيق!"
  );
  const [manualMessage, setManualMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [history, setHistory] = useState<{ id: string; date: string; type: string; status: "success" | "failed" }[]>([]);

  const { showToast } = useToast();

  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return <div className="p-8 text-center font-bold">جاري التحميل...</div>;

  function handleSaveSettings() {
    // حفظ في localStorage كإعداد مؤقت حتى ربط الـ API الحقيقي
    localStorage.setItem("flow-whatsapp-settings", JSON.stringify({ autoExam, autoWeekly, examTemplate }));
    showToast("تم حفظ إعدادات الواتساب بنجاح ✓", "success");
  }

  function handleSendManual() {
    if (!manualMessage.trim()) return;
    setSending(true);
    // محاكاة إرسال — سيتم ربطه بـ WhatsApp Business API
    setTimeout(() => {
      setSending(false);
      setManualMessage("");
      const entry = {
        id: `h-${Date.now()}`,
        date: new Date().toLocaleTimeString("ar-SA"),
        type: "رسالة يدوية",
        status: "success" as const,
      };
      setHistory(prev => [entry, ...prev]);
      showToast("تم إرسال الرسالة بنجاح ✓", "success");
    }, 1200);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="fade-up rounded-2xl bg-[#25d366] px-7 py-6 text-white shadow-lg shadow-[#25d366]/20">
        <div className="flex items-center gap-3 mb-1">
          <IconBrandWhatsapp size={28} />
          <h2 className="text-xl font-black">إشعارات الواتساب لأولياء الأمور</h2>
        </div>
        <p className="text-white/80 text-sm font-semibold">إعداد الإشعارات التلقائية وإرسال رسائل لأولياء الأمور.</p>
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
                  <p className="text-xs text-text-muted mt-2">
                    {"{name}"} = اسم الطالب &nbsp;|&nbsp; {"{score}"} = النتيجة% &nbsp;|&nbsp; {"{track}"} = المسار
                  </p>
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

              <button onClick={handleSaveSettings} className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-dark">
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
                <label className="text-xs font-black text-text-muted mb-1.5 block">رقم ولي الأمر (واتساب)</label>
                <div className="relative">
                  <IconUser size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"/>
                  <input
                    type="tel"
                    placeholder="05XXXXXXXX"
                    dir="ltr"
                    className="w-full rounded-xl border border-border bg-bg py-2.5 pl-3 pr-10 text-sm font-semibold outline-none focus:border-primary"
                  />
                </div>
                <p className="text-xs text-text-muted mt-1">أدخل رقم الجوال بصيغة 05XXXXXXXX</p>
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
              {history.length === 0 ? (
                <p className="text-center text-sm text-text-muted font-semibold py-6">لا يوجد سجل إرسال بعد</p>
              ) : history.map(h => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-bg">
                  <div>
                    <div className="font-bold text-sm text-text">{h.type}</div>
                    <div className="text-xs text-text-muted font-semibold mt-0.5">{h.date}</div>
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
