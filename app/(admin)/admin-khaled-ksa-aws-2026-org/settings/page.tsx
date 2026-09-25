"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  searchStudentToPromote, 
  promoteToModerator, 
  demoteModerator, 
  fetchModerators 
} from "@/lib/supabase/services/admin-management";
import { IconSearch, IconUserPlus, IconTrash, IconKey, IconWorld, IconShieldLock, IconCheck } from "@tabler/icons-react";
import { getRegistrationMode, setRegistrationAdminOnly } from "@/lib/supabase/services/registration-actions";
import type { RegistrationMode } from "@/lib/registration-mode";

export default function SettingsPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);

  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchMessage, setSearchMessage] = useState("");
  const [searching, setSearching] = useState(false);

  // طريقة إنشاء الحسابات
  const [regMode, setRegMode] = useState<RegistrationMode | null>(null);
  const [savingRegMode, setSavingRegMode] = useState(false);

  useEffect(() => {
    getRegistrationMode()
      .then(setRegMode)
      .catch(() => setRegMode({ adminOnly: false, changedAt: null }));
  }, []);

  const handleRegistrationMode = async (adminOnly: boolean) => {
    if (!regMode || regMode.adminOnly === adminOnly || savingRegMode) return;
    if (
      adminOnly &&
      !confirm("سيُرفض إنشاء أي حساب جديد عبر التسجيل الذاتي أو Google. الحسابات الحالية تستمر بالعمل، وأي حساب جديد تنشئه أنت من صفحة الطلاب. هل تريد المتابعة؟")
    ) return;
    setSavingRegMode(true);
    const res = await setRegistrationAdminOnly(adminOnly);
    if (res.success) {
      setRegMode(await getRegistrationMode());
    } else {
      alert(res.error || "فشل حفظ الإعداد");
    }
    setSavingRegMode(false);
  };

  const [moderators, setModerators] = useState<any[]>([]);
  const [loadingMods, setLoadingMods] = useState(true);

  const loadModerators = async () => {
    setLoadingMods(true);
    const mods = await fetchModerators();
    setModerators(mods);
    setLoadingMods(false);
  };

  useEffect(() => {
    loadModerators();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setPasswordMessage("كلمات المرور غير متطابقة");
      return;
    }
    if (password.length < 6) {
      setPasswordMessage("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setChangingPwd(true);
    setPasswordMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setPasswordMessage("حدث خطأ أثناء تغيير كلمة المرور: " + error.message);
      } else {
        setPasswordMessage("تم تغيير كلمة المرور بنجاح!");
        setPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordMessage("حدث خطأ غير متوقع");
    } finally {
      setChangingPwd(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail) return;
    setSearching(true);
    setSearchMessage("");
    setSearchResult(null);
    const res = await searchStudentToPromote(searchEmail);
    if (res.success) {
      setSearchResult(res.student);
    } else {
      setSearchMessage(res.message || "حدث خطأ غير معروف");
    }
    setSearching(false);
  };

  const handlePromote = async () => {
    if (!searchResult) return;
    const res = await promoteToModerator(searchResult.id);
    if (res.success) {
      setSearchMessage(res.message || "تم بنجاح");
      setSearchResult(null);
      setSearchEmail("");
      loadModerators();
    } else {
      setSearchMessage(res.message || "حدث خطأ غير معروف");
    }
  };

  const handleDemote = async (id: string) => {
    if (!confirm("هل أنت متأكد من سحب صلاحيات هذا المشرف؟")) return;
    const res = await demoteModerator(id);
    if (res.success) {
      loadModerators();
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-text tracking-tight">الإعدادات والصلاحيات</h1>
        <p className="text-text/60">إدارة حسابك الشخصي وصلاحيات المشرفين</p>
      </div>

      {/* طريقة إنشاء الحسابات */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
            <IconShieldLock size={24} />
          </div>
          <h2 className="text-xl font-bold text-text">طريقة إنشاء الحسابات</h2>
        </div>
        <p className="text-sm text-text/60 mb-5">
          تحدد كيف يحصل الطلاب على حساباتهم. الحسابات الموجودة لا تتأثر بالتبديل.
        </p>
        {regMode === null ? (
          <div className="text-sm text-text-muted">جاري التحميل...</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              disabled={savingRegMode}
              onClick={() => handleRegistrationMode(false)}
              className={`text-right rounded-xl border-2 p-4 transition-all disabled:opacity-60 ${!regMode.adminOnly ? "border-primary bg-primary/5" : "border-border bg-bg hover:border-primary/40"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-2 font-bold text-text"><IconWorld size={18} className="text-primary" /> التسجيل الذاتي مفتوح</span>
                {!regMode.adminOnly && <IconCheck size={18} className="text-primary" />}
              </div>
              <p className="text-xs text-text/60 leading-relaxed">الطالب ينشئ حسابه بنفسه من صفحة الدخول عبر جوجل أو البريد الإلكتروني (الوضع الحالي).</p>
            </button>
            <button
              type="button"
              disabled={savingRegMode}
              onClick={() => handleRegistrationMode(true)}
              className={`text-right rounded-xl border-2 p-4 transition-all disabled:opacity-60 ${regMode.adminOnly ? "border-primary bg-primary/5" : "border-border bg-bg hover:border-primary/40"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-2 font-bold text-text"><IconShieldLock size={18} className="text-emerald-600" /> الإضافة عبر المدير فقط</span>
                {regMode.adminOnly && <IconCheck size={18} className="text-primary" />}
              </div>
              <p className="text-xs text-text/60 leading-relaxed">يُرفض أي حساب جديد لا ينشئه المدير (حتى من لوحة Supabase). تنشئ الحسابات من صفحة الطلاب (زر «إضافة حساب طالب»). الحسابات الحالية تدخل كالمعتاد بالبريد أو Google.</p>
            </button>
          </div>
        )}
        {regMode?.changedAt && (
          <p className="mt-3 text-xs text-text-muted">آخر تغيير: {new Date(regMode.changedAt).toLocaleString("ar-SA")}</p>
        )}
        {savingRegMode && <p className="mt-2 text-xs text-primary font-bold">جاري الحفظ...</p>}
      </div>

      {/* تغيير كلمة المرور */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <IconKey size={24} />
          </div>
          <h2 className="text-xl font-bold text-text">تغيير كلمة المرور</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="flex flex-col gap-4 max-w-sm">
          <input
            type="password"
            placeholder="كلمة المرور الجديدة"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-bg px-4 text-text focus:border-primary focus:outline-none"
            required
          />
          <input
            type="password"
            placeholder="تأكيد كلمة المرور"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-bg px-4 text-text focus:border-primary focus:outline-none"
            required
          />
          {passwordMessage && (
            <p className={`text-sm ${passwordMessage.includes("بنجاح") ? "text-green-500" : "text-accent-red"}`}>
              {passwordMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={changingPwd}
            className="h-12 w-full rounded-xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-60"
          >
            {changingPwd ? "جاري التحديث..." : "حفظ كلمة المرور"}
          </button>
        </form>
      </div>

      {/* إدارة المشرفين */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-accent-amber/10 text-accent-amber">
            <IconUserPlus size={24} />
          </div>
          <h2 className="text-xl font-bold text-text">إدارة مشرفي المحتوى</h2>
        </div>
        
        <p className="text-sm text-text/60 mb-6">
          مشرف المحتوى يمكنه إدارة الدورات والدروس والاختبارات فقط، ولا يمكنه الاطلاع على حسابات الطلاب أو المعاملات المالية.
          لإضافة مشرف، قم بالبحث عن حسابه (كطالب) باستخدام البريد الإلكتروني.
        </p>

        {/* بحث وترقية */}
        <div className="flex flex-col gap-4 mb-8 pb-8 border-b border-border">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="email"
              placeholder="البريد الإلكتروني للطالب..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="h-12 flex-1 rounded-xl border border-border bg-bg px-4 text-text focus:border-primary focus:outline-none"
              required
            />
            <button
              type="submit"
              disabled={searching}
              className="h-12 px-6 rounded-xl bg-bg border border-border text-text font-bold hover:bg-bg/80 flex items-center gap-2"
            >
              <IconSearch size={18} />
              {searching ? "جاري البحث..." : "بحث"}
            </button>
          </form>
          {searchMessage && <p className="text-sm text-accent-red">{searchMessage}</p>}
          
          {searchResult && (
            <div className="flex items-center justify-between p-4 rounded-xl border border-primary/30 bg-primary/5">
              <div className="flex flex-col">
                <span className="font-bold text-text">{searchResult.full_name}</span>
                <span className="text-sm text-text/60">{searchResult.email}</span>
              </div>
              <button
                onClick={handlePromote}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90"
              >
                ترقية إلى مشرف
              </button>
            </div>
          )}
        </div>

        {/* قائمة المشرفين */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-text">المشرفون الحاليون</h3>
          {loadingMods ? (
            <p className="text-text/60">جاري التحميل...</p>
          ) : moderators.length === 0 ? (
            <p className="text-text/60 text-sm">لا يوجد مشرفي محتوى حالياً.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {moderators.map((mod) => (
                <div key={mod.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-bg">
                  <div className="flex flex-col">
                    <span className="font-bold text-text">{mod.full_name}</span>
                    <span className="text-sm text-text/60">{mod.email}</span>
                  </div>
                  <button
                    onClick={() => handleDemote(mod.id)}
                    className="flex items-center justify-center p-2 rounded-lg bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors"
                    title="سحب الصلاحيات"
                  >
                    <IconTrash size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
