// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import {
  IconBell, IconSend, IconUsers, IconBellRinging,
  IconCheck, IconAlertTriangle, IconHistory, IconTrash
} from "@tabler/icons-react";
import { broadcastInAppNotification, deleteBroadcastNotification, getBroadcastLogs } from "@/app/actions/admin-actions";

type NotifLog = {
  id: string;
  title: string;
  body: string;
  sent_at: string;
  recipient_count: number;
};

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; pushSent?: number } | null>(null);
  const [logs, setLogs] = useState<NotifLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoadingLogs(true);
    const res = await getBroadcastLogs();
    if (res.success) setLogs(res.logs);
    setLoadingLogs(false);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setSending(true);
    setResult(null);
    const res = await broadcastInAppNotification(title.trim(), body.trim());
    
    if (res.success) {
      setResult({ sent: res.count || 0, pushSent: (res as any).pushSent || 0 });
      setTitle("");
      setBody("");
      fetchData(); // refresh logs
    } else {
      setResult({ sent: 0 });
    }
    setSending(false);
  }

  async function handleDelete(log: NotifLog) {
    if (!confirm("هل أنت متأكد من حذف هذا الإشعار من جميع الطلاب؟")) return;
    await deleteBroadcastNotification(log.id, log.title, log.body);
    fetchData();
  }

  return (
    <div className="p-6 w-full" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-text flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <IconBellRinging size={22} />
          </div>
          إشعارات الطلاب
        </h1>
        <p className="text-text-muted font-semibold text-sm mt-1">
          إرسال إشعارات فورية لجميع طلاب التطبيق
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Form */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-black text-text text-lg mb-6 flex items-center gap-2">
              <IconSend size={20} className="text-primary" />
              إرسال إشعار جديد
            </h2>

            <form onSubmit={handleSend} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-black text-text mb-2">عنوان الإشعار *</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="مثال: درس جديد متاح الآن! 🎓"
                  maxLength={80}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-sm font-semibold outline-none focus:border-primary transition-colors"
                />
                <p className="text-xs text-text-muted mt-1">{title.length}/80</p>
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-black text-text mb-2">نص الإشعار *</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="مثال: تم إضافة درس جديد في قسم الرياضيات، افتح التطبيق الآن لمشاهدته!"
                  maxLength={200}
                  rows={3}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-sm font-semibold outline-none focus:border-primary transition-colors resize-none"
                />
                <p className="text-xs text-text-muted mt-1">{body.length}/200</p>
              </div>

              {/* Preview */}
              {(title || body) && (
                <div className="rounded-2xl border border-border bg-bg p-4">
                  <p className="text-xs font-black text-text-muted mb-3">معاينة الإشعار</p>
                  <div className="flex items-start gap-3 bg-card rounded-xl p-3 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center flex-shrink-0 text-lg">
                      🎓
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-text text-sm">{title || "عنوان الإشعار"}</p>
                      <p className="text-text-muted text-xs mt-0.5 line-clamp-2">{body || "نص الإشعار"}</p>
                      <p className="text-text-muted/60 text-xs mt-1">الأوس الماسية · الآن</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Result */}
              {result && (
                <div className={`rounded-xl border p-4 space-y-2 ${
                  result.sent > 0 ? "bg-accent-teal/10 border-accent-teal/20" : "bg-accent-amber/10 border-accent-amber/20"
                }`}>
                  <div className="flex items-center gap-2 font-bold text-sm text-accent-teal">
                    <IconCheck size={18} />
                    تم الإرسال لـ {result.sent} طالب داخل التطبيق (جرس الإشعارات)
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
                    🔔 إشعار الهاتف: وصل لـ {result.pushSent ?? 0} جهاز مفعّل تلقي الإشعارات
                    {(result.pushSent ?? 0) === 0 && <span className="text-amber-600"> — لا يوجد طلاب فعّلوا إشعارات الهاتف</span>}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={sending || !title.trim() || !body.trim()}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-black text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> جاري الإرسال...</>
                ) : (
                  <><IconSend size={16} /> إرسال للجميع</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Stats + Logs */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-black text-text mb-4 flex items-center gap-2">
              <IconUsers size={18} className="text-primary" />
              إحصائيات
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-muted">إجمالي الإرسالات</span>
                <span className="font-black text-text text-lg">{logs.length}</span>
              </div>
            </div>
          </div>

          {/* Logs */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-black text-text mb-4 flex items-center gap-2">
              <IconHistory size={18} className="text-primary" />
              آخر الإشعارات
            </h3>
            {loadingLogs ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <p className="text-text-muted text-sm font-semibold text-center py-4">لم يتم إرسال إشعارات بعد</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {logs.map(log => (
                  <div key={log.id} className="p-3 rounded-xl bg-bg border border-border relative group">
                    <button 
                      onClick={() => handleDelete(log)}
                      className="absolute top-3 left-3 text-red-500 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      title="حذف الإشعار من جميع الطلاب"
                    >
                      <IconTrash size={16} />
                    </button>
                    <p className="font-black text-text text-sm ml-8">{log.title}</p>
                    <p className="text-text-muted text-xs mt-0.5 line-clamp-2">{log.body}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-bold text-accent-teal">
                        {log.recipient_count} مستلم
                      </span>
                      <span className="text-xs text-text-muted">
                        {new Date(log.sent_at).toLocaleDateString("ar-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
