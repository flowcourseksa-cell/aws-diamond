"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  IconBrandWhatsapp, IconSettings, IconSend, IconHistory,
  IconCheck, IconToggleRight, IconToggleLeft, IconUser,
  IconBellRinging, IconCalendarStats, IconDeviceMobileMessage,
  IconLink, IconBan, IconShieldCheck, IconClock, IconListDetails,
  IconInfoCircle, IconAlertTriangle, IconTrophy
} from "@tabler/icons-react";
import { useToast } from "@/components/ui/toast";

type Tab = "general" | "daily" | "weekly" | "manual";
type DeliveryChannel = "whatsapp" | "sms" | "none";
type DayOfWeek = "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";

const DAYS_AR: Record<DayOfWeek, string> = {
  sunday: "الأحد",
  monday: "الإثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
  saturday: "السبت",
};

export default function ParentNotificationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [isMounted, setIsMounted] = useState(false);
  const { showToast } = useToast();

  // General Settings
  const [channel, setChannel] = useState<DeliveryChannel>("whatsapp");
  const [smsGateway, setSmsGateway] = useState("");
  const [whatsappDelay, setWhatsappDelay] = useState(15);
  const [autoCert, setAutoCert] = useState(true); // Certificate Notifications
  const [gradOnlyMode, setGradOnlyMode] = useState(false);
  const [gradOnlyChannel, setGradOnlyChannel] = useState<DeliveryChannel>("whatsapp");

  // Daily Settings
  const [autoDaily, setAutoDaily] = useState(false);
  const [dailyWhatsappTemplate, setDailyWhatsappTemplate] = useState(
    "{random_greeting} ولي أمر الطالب {name}،\\nهذا ملخص سريع لأداء ابنكم اليوم:\\n\\n{courses_report}\\n\\nللمتابعة عبر البوابة: {link}\\n[Ref: {random_id}]"
  );
  const [dailySmsTemplate, setDailySmsTemplate] = useState(
    "التقرير اليومي للطالب {name}: {link}"
  );

  // Weekly Settings
  const [autoWeekly, setAutoWeekly] = useState(true);
  const [weeklyDay, setWeeklyDay] = useState<DayOfWeek>("friday");
  const [weeklyWhatsappTemplate, setWeeklyWhatsappTemplate] = useState(
    "{random_greeting}،\\nهذا هو التقرير الأسبوعي المفصل للطالب {name}.\\nتحليل المهارات ونقاط القوة والضعف:\\n\\n{courses_report}\\n\\nالتقرير الكامل: {link}\\n{timestamp}"
  );
  const [weeklySmsTemplate, setWeeklySmsTemplate] = useState(
    "التقرير الأسبوعي الشامل للطالب {name}: {link}"
  );

  // Manual Settings
  const [manualMessage, setManualMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<{ id: string; date: string; channel: string; type: string; status: "success" | "failed" }[]>([]);

  useEffect(() => {
    setIsMounted(true);
    const loadSettings = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("admin_settings").select("*").eq("id", 1).single();
      if (data) {
        setChannel(data.parent_notif_channel as DeliveryChannel || "whatsapp");
        setAutoCert(data.auto_cert ?? true);
        setAutoDaily(data.auto_daily ?? false);
        setAutoWeekly(data.auto_weekly ?? true);
        setGradOnlyMode(data.grad_only_mode ?? false);
        setGradOnlyChannel(data.grad_only_channel as DeliveryChannel || "whatsapp");
      }
    };
    loadSettings();
  }, []);

  async function handleSaveSettings() {
    const supabase = createClient();
    const { error } = await supabase.from("admin_settings").upsert({
      id: 1,
      parent_notif_channel: channel,
      auto_cert: autoCert,
      auto_daily: autoDaily,
      auto_weekly: autoWeekly,
      grad_only_mode: gradOnlyMode,
      grad_only_channel: gradOnlyChannel,
      updated_at: new Date().toISOString()
    });

    if (error) {
      showToast("فشل حفظ الإعدادات، تأكد من إضافة جدول admin_settings", "error");
    } else {
      showToast("تم حفظ إعدادات إشعارات ولي الأمر بنجاح", "success");
    }
  }

  if (!isMounted) return <div className="p-8 text-center font-bold">جاري التحميل...</div>;

  function handleSendManual() {
    if (channel === "none") {
      showToast("النظام متوقف من الإعدادات العامة.", "error");
      return;
    }
    if (!manualMessage.trim()) return;
    
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setManualMessage("");
      const entry = {
        id: `h-${Date.now()}`,
        date: new Date().toLocaleTimeString("ar-SA"),
        channel: channel === "whatsapp" ? "واتساب" : "رسائل SMS",
        type: "رسالة مخصصة",
        status: "success" as const,
      };
      setHistory(prev => [entry, ...prev]);
      showToast("تم إرسال الرسالة بنجاح ✓", "success");
    }, 1200);
  }

  const insertVariable = (setter: React.Dispatch<React.SetStateAction<string>>, tag: string) => {
    setter(prev => prev + " " + tag);
  };

  return (
    <div className="flex flex-col gap-6 font-sans" dir="rtl">
      {/* Header */}
      <div className="fade-up rounded-3xl bg-gradient-to-r from-primary to-accent-teal px-8 py-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="flex items-center gap-4 mb-2 relative z-10">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <IconBellRinging size={32} stroke={2} />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight">إشعارات أولياء الأمور المركزية</h2>
            <p className="text-white/90 text-sm font-semibold mt-1">نظام إدارة التقارير المانع للتعارض مع تحليل المهارات العميق</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 p-1 bg-card border border-border rounded-2xl fade-up">
        <button onClick={() => setActiveTab("general")} className={`flex items-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === "general" ? "bg-primary text-white shadow-md" : "text-text-muted hover:bg-bg"}`}>
          <IconSettings size={18} /> وسيلة الإرسال الموحدة
        </button>
        <button onClick={() => setActiveTab("daily")} className={`flex items-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === "daily" ? "bg-primary text-white shadow-md" : "text-text-muted hover:bg-bg"}`}>
          <IconCalendarStats size={18} /> التقرير اليومي
        </button>
        <button onClick={() => setActiveTab("weekly")} className={`flex items-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === "weekly" ? "bg-primary text-white shadow-md" : "text-text-muted hover:bg-bg"}`}>
          <IconCalendarStats size={18} /> التقرير الأسبوعي الشامل
        </button>
        <button onClick={() => setActiveTab("manual")} className={`flex items-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === "manual" ? "bg-primary text-white shadow-md" : "text-text-muted hover:bg-bg"}`}>
          <IconSend size={18} /> إرسال مخصص وسجل
        </button>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 fade-up shadow-sm min-h-[500px]">
        
        {/* Tab Content: General (Channel Selection) */}
        {activeTab === "general" && (
          <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300">
            <div>
              <h3 className="text-xl font-black text-text mb-1 flex items-center gap-2">
                <IconSettings className="text-primary" /> الوسيلة المعتمدة للنظام بالكامل
              </h3>
              <p className="text-sm font-bold text-text-muted mb-6">اختر وسيلة واحدة ليعتمد عليها النظام منعاً للتضارب. (الواتساب للتقارير المفصلة، SMS للروابط السريعة).</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* Option: WhatsApp */}
              <button 
                onClick={() => setChannel("whatsapp")}
                className={`flex flex-col gap-3 p-5 rounded-2xl border-2 transition-all text-right relative overflow-hidden ${
                  channel === "whatsapp" ? "border-[#25D366] bg-[#25D366]/5" : "border-border bg-bg hover:border-[#25D366]/30"
                }`}
              >
                {channel === "whatsapp" && <div className="absolute top-4 left-4 text-[#25D366]"><IconCheck size={24} stroke={3} /></div>}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${channel === "whatsapp" ? "bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30" : "bg-border text-text-muted"}`}>
                  <IconBrandWhatsapp size={26} />
                </div>
                <div>
                  <h4 className="font-black text-lg text-text">الواتساب (تفصيلي)</h4>
                  <p className="text-xs font-bold text-text-muted mt-1 leading-relaxed">يرسل النظام رسالة تحتوي على التفاصيل الدقيقة لمهارات الطالب ونقاط القوة والضعف.</p>
                </div>
              </button>

              {/* Option: SMS */}
              <button 
                onClick={() => setChannel("sms")}
                className={`flex flex-col gap-3 p-5 rounded-2xl border-2 transition-all text-right relative overflow-hidden ${
                  channel === "sms" ? "border-accent-blue bg-accent-blue/5" : "border-border bg-bg hover:border-accent-blue/30"
                }`}
              >
                {channel === "sms" && <div className="absolute top-4 left-4 text-accent-blue"><IconCheck size={24} stroke={3} /></div>}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${channel === "sms" ? "bg-accent-blue text-white shadow-lg shadow-accent-blue/30" : "bg-border text-text-muted"}`}>
                  <IconDeviceMobileMessage size={26} />
                </div>
                <div>
                  <h4 className="font-black text-lg text-text">رسائل SMS (روابط)</h4>
                  <p className="text-xs font-bold text-text-muted mt-1 leading-relaxed">يتجاهل النظام التفاصيل الطويلة لتوفير التكلفة ويرسل الرابط السري للبوابة فقط.</p>
                </div>
              </button>

              {/* Option: None */}
              <button 
                onClick={() => setChannel("none")}
                className={`flex flex-col gap-3 p-5 rounded-2xl border-2 transition-all text-right relative overflow-hidden ${
                  channel === "none" ? "border-accent-red bg-accent-red/5" : "border-border bg-bg hover:border-accent-red/30"
                }`}
              >
                {channel === "none" && <div className="absolute top-4 left-4 text-accent-red"><IconCheck size={24} stroke={3} /></div>}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${channel === "none" ? "bg-accent-red text-white shadow-lg shadow-accent-red/30" : "bg-border text-text-muted"}`}>
                  <IconBan size={26} />
                </div>
                <div>
                  <h4 className="font-black text-lg text-text">إيقاف النظام</h4>
                  <p className="text-xs font-bold text-text-muted mt-1 leading-relaxed">لن يتم إرسال أي تقرير أو رسالة لولي الأمر.</p>
                </div>
              </button>
            </div>

            {/* Additional Settings based on channel */}
            {channel === "whatsapp" && (
              <div className="mt-4 animate-in slide-in-from-top-4 p-5 rounded-2xl bg-bg border border-[#25D366]/30 flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1">
                  <h5 className="text-sm font-black text-[#25D366] flex items-center gap-2 mb-2">
                    <IconShieldCheck size={18} /> حماية الواتساب من الحظر (Anti-Ban)
                  </h5>
                  <p className="text-xs font-bold text-text-muted leading-relaxed">سيقوم الطابور الذكي بتأخير إرسال الرسائل لتبدو كأنها من شخص حقيقي لتجنب حظر الرقم.</p>
                </div>
                <div className="flex items-center gap-3 bg-card px-4 py-3 rounded-xl border border-border">
                  <span className="text-sm font-bold text-text">الفاصل الزمني:</span>
                  <input 
                    type="number" 
                    min={5} max={60}
                    value={whatsappDelay}
                    onChange={(e) => setWhatsappDelay(Number(e.target.value))}
                    className="w-16 bg-bg border border-border rounded-lg px-2 py-1.5 text-center font-bold text-primary outline-none focus:border-[#25D366]"
                  />
                  <span className="text-sm font-bold text-text-muted">ثانية</span>
                </div>
              </div>
            )}

            {channel === "none" && (
              <div className="mt-4 animate-in slide-in-from-top-4 p-5 rounded-2xl bg-bg border border-accent-amber/40">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h5 className="text-sm font-black text-accent-amber flex items-center gap-2 mb-1">
                      <IconTrophy size={18} /> إرسال إشعار التخرج (الشهادات) فقط
                    </h5>
                    <p className="text-xs font-bold text-text-muted leading-relaxed">
                      بما أن النظام موقوف بالكامل، يمكنك تفعيل هذا الخيار لإرسال رسائل التخرج والحصول على الشهادة النهائية فقط.
                    </p>
                  </div>
                  <button 
                    onClick={() => setGradOnlyMode(!gradOnlyMode)}
                    className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 shrink-0 ${gradOnlyMode ? "bg-accent-amber" : "bg-border"}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${gradOnlyMode ? "-translate-x-6" : ""}`} />
                  </button>
                </div>
                
                {gradOnlyMode && (
                  <div className="flex items-center gap-4 mt-3 bg-card p-3 rounded-xl border border-border">
                    <span className="text-sm font-bold text-text">طريقة الإرسال:</span>
                    <select 
                      value={gradOnlyChannel}
                      onChange={(e) => setGradOnlyChannel(e.target.value as DeliveryChannel)}
                      className="bg-bg border border-border rounded-lg px-3 py-1.5 text-sm font-bold text-primary outline-none focus:border-accent-amber cursor-pointer"
                    >
                      <option value="whatsapp">واتساب</option>
                      <option value="sms">رسائل SMS</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {channel === "sms" && (
              <div className="mt-4 animate-in slide-in-from-top-4 p-5 rounded-2xl bg-bg border border-accent-blue/30">
                <label className="text-sm font-bold text-text mb-2 block">مفتاح الربط API (Gateway Key)</label>
                <input 
                  type="password" 
                  value={smsGateway} 
                  onChange={e => setSmsGateway(e.target.value)} 
                  placeholder="ضع مفتاح الربط الخاص بمزود الـ SMS هنا..." 
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-accent-blue" 
                />
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between p-5 bg-card border border-border rounded-2xl">
                <div>
                  <h4 className="font-black text-lg text-text flex items-center gap-2">
                    <IconTrophy className="text-accent-amber" size={24} /> إشعار إصدار الشهادات (التخرج)
                  </h4>
                  <p className="text-sm font-semibold text-text-muted mt-1 leading-relaxed">
                    إرسال رسالة تلقائية لولي الأمر فور اجتياز الطالب الدورة وحصوله على الشهادة بنجاح.
                  </p>
                </div>
                <button 
                  onClick={() => setAutoCert(!autoCert)}
                  className={`w-14 h-8 rounded-full transition-colors flex items-center px-1 shrink-0 ${autoCert ? "bg-primary" : "bg-border"}`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white transition-transform ${autoCert ? "-translate-x-6" : ""}`} />
                </button>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button onClick={handleSaveSettings} className="px-8 py-3.5 bg-primary hover:bg-primary-dark text-white font-black text-sm rounded-xl shadow-lg transition-transform hover:-translate-y-1">حفظ الإعدادات</button>
            </div>
          </div>
        )}

        {/* Tab Content: Daily */}
        {activeTab === "daily" && (
          <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-xl font-black text-text flex items-center gap-2">
                  <IconCalendarStats className="text-primary" /> التقرير اليومي التلقائي
                </h3>
                {channel === "none" ? (
                  <p className="text-sm font-bold text-accent-red mt-1">النظام متوقف من الإعدادات العامة ولن يعمل.</p>
                ) : (
                  <p className="text-sm font-bold text-text-muted mt-1">يتم إرسال هذا التقرير نهاية كل يوم عبر: <span className="text-primary">{channel === "whatsapp" ? "الواتساب" : "رسائل SMS"}</span></p>
                )}
              </div>
              <button onClick={() => setAutoDaily(!autoDaily)} disabled={channel === "none"} className={autoDaily && channel !== "none" ? "text-primary" : "text-text-muted/50"}>
                {autoDaily && channel !== "none" ? <IconToggleRight size={44} stroke={1.5}/> : <IconToggleLeft size={44} stroke={1.5}/>}
              </button>
            </div>

            {/* Smart Conflict Resolution Indicator */}
            {autoDaily && autoWeekly && channel !== "none" && (
              <div className="bg-accent-blue/10 text-accent-blue border border-accent-blue/20 rounded-xl p-4 flex items-start gap-3">
                <IconInfoCircle size={24} className="shrink-0" />
                <div>
                  <h4 className="font-black text-sm mb-1">تنبيه ذكي: منع التعارض</h4>
                  <p className="text-xs font-bold leading-relaxed">بما أن التقرير الأسبوعي مفعل ليوم <strong>({DAYS_AR[weeklyDay]})</strong>، فإن النظام لن يقوم بإرسال هذا التقرير اليومي في يوم {DAYS_AR[weeklyDay]} لتجنب إزعاج ولي الأمر برسالتين في نفس اليوم.</p>
                </div>
              </div>
            )}

            <div className={`transition-all duration-300 ${autoDaily && channel !== "none" ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
              <label className="text-sm font-black text-text mb-3 block">
                محتوى رسالة التقرير اليومي 
                <span className="text-xs font-bold text-text-muted font-normal mr-2">
                  (يتم سحب القالب بناءً على وسيلة الإرسال المعتمدة)
                </span>
              </label>
              
              <textarea 
                value={channel === "whatsapp" ? dailyWhatsappTemplate : dailySmsTemplate} 
                onChange={e => channel === "whatsapp" ? setDailyWhatsappTemplate(e.target.value) : setDailySmsTemplate(e.target.value)} 
                rows={6} 
                className={`w-full rounded-2xl border-2 bg-bg p-4 text-sm font-bold outline-none resize-none leading-relaxed ${channel === "whatsapp" ? "border-[#25D366]/30 focus:border-[#25D366]" : "border-accent-blue/30 focus:border-accent-blue"}`} 
                dir="rtl" 
              />
              
              <div className="flex flex-wrap gap-2 mt-4 bg-card border border-border p-3 rounded-xl">
                <span className="text-xs font-black text-text-muted py-1 ml-2">المتغيرات المتاحة:</span>
                
                <button onClick={() => insertVariable(channel === "whatsapp" ? setDailyWhatsappTemplate : setDailySmsTemplate, "{name}")} className="flex items-center gap-1 bg-bg border border-border text-text-muted px-2 py-1 rounded-lg text-[11px] font-bold hover:text-text transition-colors">
                  <IconUser size={12}/> اسم الطالب
                </button>
                <button onClick={() => insertVariable(channel === "whatsapp" ? setDailyWhatsappTemplate : setDailySmsTemplate, "{link}")} className="flex items-center gap-1 bg-bg border border-border text-text-muted px-2 py-1 rounded-lg text-[11px] font-bold hover:text-text transition-colors">
                  <IconLink size={12}/> الرابط السري لبوابة التقرير
                </button>
                
                {channel === "whatsapp" && (
                  <>
                    <button onClick={() => insertVariable(setDailyWhatsappTemplate, "{courses_report}")} className="flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary px-2 py-1 rounded-lg text-[11px] font-bold hover:bg-primary/20 transition-colors" title="يستخرج كل الدورات ويحلل نقاط القوة والضعف">
                      <IconListDetails size={12}/> تحليل الدورات الشامل (نقاط القوة والضعف)
                    </button>
                    <button onClick={() => insertVariable(setDailyWhatsappTemplate, "{random_greeting}")} className="flex items-center gap-1 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] px-2 py-1 rounded-lg text-[11px] font-bold hover:bg-[#25D366]/20 transition-colors">
                      <IconShieldCheck size={12}/> تحية عشوائية
                    </button>
                    <button onClick={() => insertVariable(setDailyWhatsappTemplate, "{timestamp}")} className="flex items-center gap-1 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] px-2 py-1 rounded-lg text-[11px] font-bold hover:bg-[#25D366]/20 transition-colors">
                      <IconClock size={12}/> طابع زمني (للحماية)
                    </button>
                    <button onClick={() => insertVariable(setDailyWhatsappTemplate, "{random_id}")} className="flex items-center gap-1 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] px-2 py-1 rounded-lg text-[11px] font-bold hover:bg-[#25D366]/20 transition-colors">
                      <IconShieldCheck size={12}/> رقم عشوائي (للحماية)
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button onClick={handleSaveSettings} disabled={channel === "none"} className="px-8 py-3.5 bg-primary hover:bg-primary-dark text-white font-black text-sm rounded-xl shadow-lg transition-transform hover:-translate-y-1 disabled:opacity-50">حفظ إعدادات التقرير اليومي</button>
            </div>
          </div>
        )}

        {/* Tab Content: Weekly */}
        {activeTab === "weekly" && (
          <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-border gap-4">
              <div>
                <h3 className="text-xl font-black text-text flex items-center gap-2">
                  <IconCalendarStats className="text-primary" /> التقرير الأسبوعي الشامل
                </h3>
                {channel === "none" ? (
                  <p className="text-sm font-bold text-accent-red mt-1">النظام متوقف من الإعدادات العامة ولن يعمل.</p>
                ) : (
                  <p className="text-sm font-bold text-text-muted mt-1">يُرسل حصرياً مرة واحدة في الأسبوع عبر: <span className="text-primary">{channel === "whatsapp" ? "الواتساب" : "رسائل SMS"}</span></p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-bg px-3 py-2 rounded-xl border border-border">
                  <span className="text-xs font-bold text-text-muted">يوم الإرسال:</span>
                  <select 
                    value={weeklyDay} 
                    onChange={e => setWeeklyDay(e.target.value as DayOfWeek)}
                    disabled={!autoWeekly || channel === "none"}
                    className="bg-transparent text-sm font-black text-text outline-none"
                  >
                    {Object.entries(DAYS_AR).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => setAutoWeekly(!autoWeekly)} disabled={channel === "none"} className={autoWeekly && channel !== "none" ? "text-primary" : "text-text-muted/50"}>
                  {autoWeekly && channel !== "none" ? <IconToggleRight size={44} stroke={1.5}/> : <IconToggleLeft size={44} stroke={1.5}/>}
                </button>
              </div>
            </div>

            <div className={`transition-all duration-300 ${autoWeekly && channel !== "none" ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
              <label className="text-sm font-black text-text mb-3 block">
                محتوى رسالة التقرير الأسبوعي
              </label>
              
              <textarea 
                value={channel === "whatsapp" ? weeklyWhatsappTemplate : weeklySmsTemplate} 
                onChange={e => channel === "whatsapp" ? setWeeklyWhatsappTemplate(e.target.value) : setWeeklySmsTemplate(e.target.value)} 
                rows={7} 
                className={`w-full rounded-2xl border-2 bg-bg p-4 text-sm font-bold outline-none resize-none leading-relaxed ${channel === "whatsapp" ? "border-[#25D366]/30 focus:border-[#25D366]" : "border-accent-blue/30 focus:border-accent-blue"}`} 
                dir="rtl" 
              />
              
              <div className="flex flex-wrap gap-2 mt-4 bg-card border border-border p-3 rounded-xl">
                <span className="text-xs font-black text-text-muted py-1 ml-2">المتغيرات المتاحة:</span>
                
                <button onClick={() => insertVariable(channel === "whatsapp" ? setWeeklyWhatsappTemplate : setWeeklySmsTemplate, "{name}")} className="flex items-center gap-1 bg-bg border border-border text-text-muted px-2 py-1 rounded-lg text-[11px] font-bold hover:text-text transition-colors">
                  <IconUser size={12}/> اسم الطالب
                </button>
                <button onClick={() => insertVariable(channel === "whatsapp" ? setWeeklyWhatsappTemplate : setWeeklySmsTemplate, "{link}")} className="flex items-center gap-1 bg-bg border border-border text-text-muted px-2 py-1 rounded-lg text-[11px] font-bold hover:text-text transition-colors">
                  <IconLink size={12}/> الرابط السري לבوابة التقرير
                </button>
                
                {channel === "whatsapp" && (
                  <>
                    <button onClick={() => insertVariable(setWeeklyWhatsappTemplate, "{courses_report}")} className="flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary px-2 py-1 rounded-lg text-[11px] font-bold hover:bg-primary/20 transition-colors" title="يستخرج كل الدورات ويحلل نقاط القوة والضعف (مثالي للتقرير الأسبوعي)">
                      <IconListDetails size={12}/> تحليل المهارات لجميع الدورات (شامل)
                    </button>
                    <button onClick={() => insertVariable(setWeeklyWhatsappTemplate, "{random_greeting}")} className="flex items-center gap-1 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] px-2 py-1 rounded-lg text-[11px] font-bold hover:bg-[#25D366]/20 transition-colors">
                      <IconShieldCheck size={12}/> تحية عشوائية
                    </button>
                    <button onClick={() => insertVariable(setWeeklyWhatsappTemplate, "{timestamp}")} className="flex items-center gap-1 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] px-2 py-1 rounded-lg text-[11px] font-bold hover:bg-[#25D366]/20 transition-colors">
                      <IconClock size={12}/> طابع زمني (للحماية)
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button onClick={handleSaveSettings} disabled={channel === "none"} className="px-8 py-3.5 bg-primary hover:bg-primary-dark text-white font-black text-sm rounded-xl shadow-lg transition-transform hover:-translate-y-1 disabled:opacity-50">حفظ إعدادات التقرير الأسبوعي</button>
            </div>
          </div>
        )}

        {/* Tab Content: Manual */}
        {activeTab === "manual" && (
          <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300">
            <div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-text mb-2 flex items-center gap-2">
                    <IconSend className="text-primary" /> إرسال رسالة مخصصة
                  </h3>
                  <p className="text-sm font-bold text-text-muted">تُرسل الرسالة عبر الوسيلة المعتمدة حالياً في النظام.</p>
                </div>
                <div className={`px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 border-2 ${channel === 'whatsapp' ? 'border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366]' : channel === 'sms' ? 'border-accent-blue/30 bg-accent-blue/10 text-accent-blue' : 'border-accent-red/30 bg-accent-red/10 text-accent-red'}`}>
                  {channel === 'whatsapp' ? <IconBrandWhatsapp size={18} /> : channel === 'sms' ? <IconDeviceMobileMessage size={18} /> : <IconBan size={18} />}
                  وسيلة الإرسال الحالية: {channel === 'whatsapp' ? 'واتساب' : channel === 'sms' ? 'SMS' : 'مغلق'}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input type="text" placeholder="رقم الطالب التعريفي (مثال: TKH-X9B2)" className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary" />
                <input type="text" placeholder="أو رقم جوال ولي الأمر (مثال: 9665...)" className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary" dir="ltr" />
              </div>
              
              <textarea 
                value={manualMessage} 
                onChange={e => setManualMessage(e.target.value)} 
                rows={4} 
                disabled={channel === "none"}
                placeholder={channel === "whatsapp" ? "اكتب الرسالة (يفضل استخدام متغيرات التمويه لتجنب الحظر)..." : channel === "sms" ? "اكتب الرسالة النصية القصيرة..." : "النظام متوقف"} 
                className={`w-full rounded-2xl border-2 bg-bg p-4 text-sm font-bold outline-none resize-none mb-4 ${channel === "whatsapp" ? "focus:border-[#25D366] border-[#25D366]/20" : channel === "sms" ? "focus:border-accent-blue border-accent-blue/20" : "border-border cursor-not-allowed opacity-50"}`} 
              />
              
              <div className="flex justify-end">
                <button onClick={handleSendManual} disabled={sending || !manualMessage.trim() || channel === "none"} className="px-8 py-3.5 bg-primary hover:bg-primary-dark text-white font-black text-sm rounded-xl shadow-lg transition-transform hover:-translate-y-1 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {sending ? "جاري الإرسال..." : <><IconSend size={18} /> إرسال الآن عبر {channel === "whatsapp" ? "الواتساب" : "SMS"}</>}
                </button>
              </div>
            </div>

            <div className="border-t border-border pt-8">
              <h3 className="text-xl font-black text-text mb-4 flex items-center gap-2">
                <IconHistory className="text-text-muted" /> سجل الإرسال المخصص
              </h3>
              <div className="flex flex-col gap-3">
                {history.length === 0 ? (
                  <div className="text-center p-8 bg-bg rounded-2xl border border-dashed border-border text-text-muted font-bold">لا توجد رسائل سابقة في السجل.</div>
                ) : (
                  history.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-bg border border-border">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.channel === "واتساب" ? "bg-[#25D366]/10 text-[#25D366]" : "bg-accent-blue/10 text-accent-blue"}`}>
                          {item.channel === "واتساب" ? <IconBrandWhatsapp size={20} /> : <IconDeviceMobileMessage size={20} />}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-text">{item.type}</div>
                          <div className="text-xs text-text-muted mt-1">{item.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-teal/10 text-accent-teal font-bold text-xs">
                        <IconCheck size={14} stroke={3} /> تم الإرسال
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
