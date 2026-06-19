"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  IconRocket,
  IconMoon,
  IconSun,
  IconEye,
  IconEyeOff,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useToast } from "@/components/ui/toast";

function isValidEmailOrPhone(value: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^(05|5)[0-9]{8}$/;
  return emailRegex.test(value) || phoneRegex.test(value.replace(/\s/g, ""));
}

export default function LoginPage() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passError, setPassError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const emailValid = isValidEmailOrPhone(emailOrPhone.trim());
    const passValid = password.length >= 6;

    setEmailError(!emailValid);
    setPassError(!passValid);

    if (!emailValid || !passValid) return;

    setLoading(true);

    // تحقق بسيط من الدور — سيُستبدل بـ Supabase Auth لاحقاً
    // المدير: admin@flow.sa / أي باسورد 6+ أحرف
    // الطالب: أي ايميل/رقم آخر
    setTimeout(() => {
      setLoading(false);
      const isAdmin = emailOrPhone.trim().toLowerCase() === "admin@flow.sa";
      
      // حفظ حالة تسجيل الدخول
      if (typeof window !== 'undefined') {
        localStorage.setItem("flow-logged-in", "true");
        localStorage.setItem("flow-user-role", isAdmin ? "admin" : "student");
      }

      let destination = isAdmin ? "/admin" : "/dashboard";
      
      // التحقق من وجود مسار عودة
      if (!isAdmin && typeof window !== 'undefined') {
        const redirect = localStorage.getItem("flow-redirect-after-login");
        if (redirect) {
          destination = redirect;
          localStorage.removeItem("flow-redirect-after-login");
        }
      }

      showToast(
        isAdmin ? "مرحباً بك مدير فلو! جاري التحويل..." : "تم تسجيل الدخول بنجاح، جاري التحويل...",
        "success"
      );
      setTimeout(() => router.push(destination), 600);
    }, 1000);
  }


  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg">
      {/* الشكل الهندسي الخلفي */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="xMinYMid slice" className="h-full w-full">
          {Array.from({ length: 60 }).map((_, i) => (
            <circle
              key={i}
              cx={Math.random() * 500}
              cy={Math.random() * 900}
              r={Math.random() * 3 + 1}
              className="fill-primary opacity-8"
            />
          ))}
        </svg>
      </div>

      {/* زر الوضع الليلي */}
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        title="تبديل الوضع الليلي"
        className="absolute left-6 top-6 z-2 flex h-10.5 w-10.5 items-center justify-center rounded-[10px] border border-border bg-card text-text transition-transform duration-200 hover:-translate-y-0.5"
        aria-label="تبديل الوضع الليلي"
      >
        {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
      </button>

      {/* البطاقة */}
      <div className="fade-up relative z-1 w-[420px] max-w-[92vw] rounded-[20px] border border-border bg-card p-10 shadow-[0_10px_40px_rgba(15,17,23,0.06)] sm:p-9">
        <div className="mb-7 flex flex-col items-center gap-2.5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
            <IconRocket size={28} />
          </div>
          <div className="text-[22px] font-black tracking-wide">فلو</div>
          <div className="text-xs font-semibold tracking-widest text-text-muted">
            EDUCATION PLATFORM
          </div>
        </div>

        <h1 className="mb-1.5 text-center text-[22px] font-bold">مرحباً بك مجدداً 👋</h1>
        <p className="mb-7 text-center text-[13.5px] text-text-muted">
          سجّل دخولك لمتابعة رحلتك نحو التميز
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4.5" noValidate>
          <div className="flex flex-col gap-2">
            <label htmlFor="emailOrPhone" className="text-[13px] font-semibold">
              البريد الإلكتروني أو رقم الجوال
            </label>
            <input
              id="emailOrPhone"
              type="text"
              placeholder="example@email.com"
              autoComplete="username"
              value={emailOrPhone}
              onChange={(e) => {
                setEmailOrPhone(e.target.value);
                if (emailError) setEmailError(false);
              }}
              className={`h-12 rounded-[10px] border bg-bg px-4 text-sm text-text outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(108,99,255,0.12)] ${
                emailError ? "border-accent-red" : "border-border focus:border-primary"
              }`}
            />
            {emailError && (
              <span className="flex items-center gap-1 text-xs font-semibold text-accent-red">
                <IconAlertCircle size={14} /> الرجاء إدخال بريد إلكتروني أو رقم جوال صحيح
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-[13px] font-semibold">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passError) setPassError(false);
                }}
                className={`h-12 w-full rounded-[10px] border bg-bg px-4 text-sm text-text outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(108,99,255,0.12)] ${
                  passError ? "border-accent-red" : "border-border focus:border-primary"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted transition-colors duration-200 hover:text-primary"
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </button>
            </div>
            {passError && (
              <span className="flex items-center gap-1 text-xs font-semibold text-accent-red">
                <IconAlertCircle size={14} /> كلمة المرور يجب أن تكون 6 أحرف على الأقل
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[13px]">
            <label className="flex items-center gap-2 font-medium text-text-muted">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4.25 w-4.25 accent-primary"
              />
              تذكرني
            </label>
            <a href="#" className="font-semibold text-primary transition-colors duration-200 hover:text-primary-dark">
              نسيت كلمة المرور؟
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12.5 items-center justify-center gap-2.5 rounded-[10px] bg-primary text-[15px] font-bold text-white transition-all duration-200 hover:bg-primary-dark hover:-translate-y-px active:scale-98 disabled:opacity-75"
          >
            {loading && (
              <span className="h-4.5 w-4.5 animate-spin rounded-full border-2.5 border-white/40 border-t-white" />
            )}
            {loading ? "جاري التحقق..." : "تسجيل الدخول"}
          </button>
        </form>

        <div className="my-1.5 flex items-center gap-3 text-[12.5px] font-semibold text-text-muted">
          <span className="h-px flex-1 bg-border" />
          أو
          <span className="h-px flex-1 bg-border" />
        </div>

        <button
          onClick={() => showToast("سيتم توجيهك إلى صفحة تفعيل الحساب الجديد (قريباً)", "warning")}
          className="h-12.5 w-full rounded-[10px] border-[1.5px] border-primary text-[15px] font-bold text-primary transition-all duration-200 hover:-translate-y-px hover:bg-primary-light active:scale-98"
        >
          تفعيل حساب جديد
        </button>

        <p className="mt-7 text-center text-[11.5px] text-text-muted">
          © 2026 منصة فلو التعليمية — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
