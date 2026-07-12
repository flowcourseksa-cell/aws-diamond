"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  IconPhone,
  IconDeviceMobile,
  IconAlertCircle,
  IconBrandGoogle,
  IconUser,
  IconLock,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const { showToast } = useToast();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Errors
  const [errors, setErrors] = useState({
    fullName: false,
    phone: false,
    parentPhone: false,
    password: false,
    confirmPassword: false,
  });

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          showToast("يرجى تسجيل الدخول أولاً", "error");
          window.location.href = "/login";
          return;
        }

        const uid = session.user.id;
        setUserId(uid);

        // تحديد إذا كان المستخدم دخل بجوجل
        const provider = session.user.app_metadata?.provider;
        const isGoogle = provider === "google";
        setIsGoogleUser(isGoogle);

        // pre-fill الاسم من جوجل (قابل للتعديل)
        if (isGoogle) {
          const googleName =
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            "";
          setFullName(googleName);
        }

        // التأكد ما إذا كان الملف مكتملاً بالفعل
        const { data: profile } = await supabase
          .from("profiles")
          .select("parent_phone, role")
          .eq("id", uid)
          .single();

        if (profile && profile.parent_phone) {
          window.location.href =
            profile.role === "admin" ? "/admin-khaled-ksa-aws-2026-org" : "/";
        } else {
          setChecking(false);
        }
      } catch (err) {
        console.error("Check user error", err);
        setChecking(false);
      }
    }
    checkUser();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const saudiPhone = /^05[0-9]{8}$/;
    const isNameValid = fullName.trim().length >= 3;
    const isPhoneValid = phone.trim() === "" || saudiPhone.test(phone.trim());
    const isParentPhoneValid = saudiPhone.test(parentPhone.trim());
    const isPasswordValid = password.length >= 6;
    const isConfirmValid = confirmPassword === password;

    setErrors({
      fullName: !isNameValid,
      phone: !isPhoneValid,
      parentPhone: !isParentPhoneValid,
      password: !isPasswordValid,
      confirmPassword: !isConfirmValid,
    });

    if (!isNameValid || !isPhoneValid || !isParentPhoneValid || !isPasswordValid || !isConfirmValid) return;
    if (!userId) return;

    setLoading(true);

    try {
      // 1. تعيين كلمة المرور (لتمكين الدخول لاحقاً بالبريد والباسورد)
      const { error: passError } = await supabase.auth.updateUser({ password });
      if (passError) throw new Error("فشل تعيين كلمة المرور، حاول مرة أخرى.");

      // 2. حفظ الملف الشخصي
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          fullName: fullName.trim(),
          phone: phone.trim(),
          parentPhone: parentPhone.trim(),
          role: "student",
        }),
      });

      const dataRes = await res.json();
      if (!res.ok) throw new Error(dataRes.error || "فشل حفظ البيانات");

      showToast(`أهلاً ${fullName.trim()}! مرحباً بك في منصة الأوس الماسية 🎉`, "success");
      setTimeout(() => { window.location.href = "/"; }, 1000);
    } catch (error: any) {
      showToast(error.message || "حدث خطأ أثناء حفظ البيانات", "error");
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/40 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="fade-up w-full max-w-md rounded-[20px] border border-border bg-card p-8 shadow-sm sm:p-10">

        {/* Header */}
        <div className="mb-7 text-center">
          {isGoogleUser && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-bg px-4 py-1.5 text-[12.5px] font-semibold text-text-muted">
              <IconBrandGoogle size={15} className="text-[#4285F4]" />
              تسجيل عبر Google
            </div>
          )}
          <h1 className="mb-1.5 text-[22px] font-bold">خطوة أخيرة 📝</h1>
          <p className="text-[13px] text-text-muted">
            أكمل بياناتك لتفعيل حسابك — أرقام الجوال مهمة لإرسال التقارير لولي الأمر
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4.5" noValidate>

          {/* الاسم الكامل */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold">
              الاسم الكامل
              {isGoogleUser && (
                <span className="mr-1.5 text-[11px] font-normal text-text-muted">(مجلوب من جوجل — يمكنك تعديله)</span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); if (errors.fullName) setErrors({ ...errors, fullName: false }); }}
                placeholder="أحمد محمد خالد..."
                className={`h-12 w-full rounded-[10px] border bg-bg px-10 text-sm text-text outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(108,99,255,0.12)] ${
                  errors.fullName ? "border-accent-red" : "border-border focus:border-primary"
                }`}
              />
              <IconUser size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            </div>
            {errors.fullName && (
              <span className="flex items-center gap-1 text-xs font-semibold text-accent-red">
                <IconAlertCircle size={14} /> يرجى إدخال اسمك الكامل (3 أحرف على الأقل)
              </span>
            )}
          </div>

          {/* رقم الجوال الشخصي */}
          <div className="flex flex-col gap-2">
            <label htmlFor="phone" className="text-sm font-semibold">رقم جوالك <span className="text-[11px] font-normal text-text-muted">(اختياري)</span></label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors({ ...errors, phone: false }); }}
                placeholder="05XXXXXXXX"
                dir="ltr"
                className={`h-12 w-full rounded-[10px] border bg-bg px-10 text-right text-sm text-text outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(108,99,255,0.12)] ${
                  errors.phone ? "border-accent-red" : "border-border focus:border-primary"
                }`}
              />
              <IconDeviceMobile size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            </div>
            {errors.phone && (
              <span className="flex items-center gap-1 text-xs font-semibold text-accent-red">
                <IconAlertCircle size={14} /> يجب أن يبدأ بـ 05 ويتكون من 10 أرقام
              </span>
            )}
          </div>

          {/* رقم ولي الأمر */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold">
              رقم واتساب ولي الأمر
              <span className="mr-1.5 text-[11px] font-normal text-primary">(الأهم — لإرسال التقارير)</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={parentPhone}
                onChange={(e) => { setParentPhone(e.target.value); if (errors.parentPhone) setErrors({ ...errors, parentPhone: false }); }}
                placeholder="05XXXXXXXX"
                dir="ltr"
                className={`h-12 w-full rounded-[10px] border bg-bg px-10 text-right text-sm text-text outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(108,99,255,0.12)] ${
                  errors.parentPhone ? "border-accent-red" : "border-border focus:border-primary"
                }`}
              />
              <IconPhone size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            </div>
            {errors.parentPhone && (
              <span className="flex items-center gap-1 text-xs font-semibold text-accent-red">
                <IconAlertCircle size={14} /> يجب أن يبدأ بـ 05 ويتكون من 10 أرقام
              </span>
            )}
            <span className="text-[11.5px] text-text-muted">
              سيُستخدم حصرياً لإرسال تقارير الأداء آلياً.
            </span>
          </div>

          {/* كلمة المرور */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold">
              كلمة المرور
              <span className="mr-1.5 text-[11px] font-normal text-text-muted">(للدخول لاحقاً بالبريد والباسورد)</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: false }); }}
                placeholder="••••••••"
                dir="ltr"
                className={`h-12 w-full rounded-[10px] border bg-bg px-10 text-right text-sm text-text outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(108,99,255,0.12)] ${
                  errors.password ? "border-accent-red" : "border-border focus:border-primary"
                }`}
              />
              <IconLock size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary"
              >
                {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </button>
            </div>
            {errors.password && (
              <span className="flex items-center gap-1 text-xs font-semibold text-accent-red">
                <IconAlertCircle size={14} /> كلمة المرور يجب أن تكون 6 أحرف على الأقل
              </span>
            )}
          </div>

          {/* تأكيد كلمة المرور */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold">تأكيد كلمة المرور</label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: false }); }}
                placeholder="••••••••"
                dir="ltr"
                className={`h-12 w-full rounded-[10px] border bg-bg px-10 text-right text-sm text-text outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(108,99,255,0.12)] ${
                  errors.confirmPassword ? "border-accent-red" : "border-border focus:border-primary"
                }`}
              />
              <IconLock size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            </div>
            {errors.confirmPassword && (
              <span className="flex items-center gap-1 text-xs font-semibold text-accent-red">
                <IconAlertCircle size={14} /> كلمتا المرور غير متطابقتين
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-12.5 items-center justify-center gap-2.5 rounded-[10px] bg-primary text-[15px] font-bold text-white transition-all hover:bg-primary-dark disabled:opacity-75"
          >
            {loading && <span className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {loading ? "جاري الحفظ..." : "دخول المنصة 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}
