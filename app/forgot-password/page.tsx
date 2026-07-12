"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { IconMail, IconArrowRight, IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();
  const supabase = createClient();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("الرجاء إدخال بريد إلكتروني صحيح");
      return;
    }

    setLoading(true);

    try {
      // التحقق من وجود الإيميل أولاً
      const checkRes = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const checkData = await checkRes.json();

      if (!checkData.exists) {
        setError("هذا البريد غير مسجّل لدينا، تأكد من صحة البريد أو أنشئ حساباً جديداً");
        setLoading(false);
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (resetError) throw resetError;

      setSuccess(true);
      showToast("تم إرسال رابط استعادة كلمة المرور لبريدك", "success");
    } catch (err: any) {
      console.error("Reset password error:", err);
      let errMsg = "حدث خطأ أثناء إرسال الرابط. تأكد من صحة البريد.";
      
      if (err?.message && err.message !== "{}") {
        errMsg = err.message;
      } else if (err?.status === 429) {
        errMsg = "لقد تجاوزت الحد المسموح للمحاولات. يرجى المحاولة بعد قليل.";
      }
      
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg p-4">
      <div className="fade-up relative z-1 w-full max-w-md rounded-[20px] border border-border bg-card p-8 shadow-sm sm:p-10">
        <div className="mb-6">
          <Link href="/login" className="flex items-center gap-1.5 text-sm font-semibold text-text-muted transition-colors hover:text-primary">
            <IconArrowRight size={18} /> العودة لتسجيل الدخول
          </Link>
        </div>

        <h1 className="mb-2 text-[22px] font-bold">نسيت كلمة المرور؟ 🔒</h1>
        <p className="mb-8 text-[13.5px] leading-relaxed text-text-muted">
          لا تقلق، أدخل بريدك الإلكتروني المسجل لدينا وسنرسل لك رابطاً لإنشاء كلمة مرور جديدة.
        </p>

        {success ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <IconCheck size={32} />
            </div>
            <h3 className="text-lg font-bold">تفقد بريدك الإلكتروني</h3>
            <p className="text-sm text-text-muted">
              أرسلنا رابط استعادة كلمة المرور إلى <strong>{email}</strong>. الرجاء الضغط على الرابط في الإيميل للمتابعة.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4.5" noValidate>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-[13px] font-semibold">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  dir="ltr"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  className={`h-12 w-full rounded-[10px] border bg-bg px-10 text-right text-sm text-text outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(108,99,255,0.12)] ${
                    error ? "border-accent-red" : "border-border focus:border-primary"
                  }`}
                />
                <IconMail size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              </div>
              {error && (
                <span className="flex items-center gap-1 text-xs font-semibold text-accent-red">
                  <IconAlertCircle size={14} /> {error}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-12.5 items-center justify-center gap-2.5 rounded-[10px] bg-primary text-[15px] font-bold text-white transition-all duration-200 hover:bg-primary-dark hover:-translate-y-px active:scale-98 disabled:opacity-75"
            >
              {loading && <span className="h-4.5 w-4.5 animate-spin rounded-full border-2.5 border-white/40 border-t-white" />}
              {loading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
