"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { IconLock, IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { showToast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    // Check if the user is authenticated (meaning they clicked the email link and were redirected here)
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast("الجلسة غير صالحة أو منتهية الصلاحية. يرجى طلب رابط جديد.", "error");
        router.push("/forgot-password");
      }
    }
    checkSession();
  }, [router, showToast, supabase.auth]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تتكون من 6 أحرف على الأقل");
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      showToast("تم تحديث كلمة المرور بنجاح!", "success");
      
      setTimeout(() => {
        router.push("/"); // Redirect to homepage
      }, 2000);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء تحديث كلمة المرور");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg p-4">
      <div className="fade-up relative z-1 w-full max-w-md rounded-[20px] border border-border bg-card p-8 shadow-sm sm:p-10">
        <h1 className="mb-2 text-[22px] font-bold">كلمة مرور جديدة 🔑</h1>
        <p className="mb-8 text-[13.5px] leading-relaxed text-text-muted">
          أدخل كلمة المرور الجديدة الخاصة بك وتأكد من حفظها في مكان آمن.
        </p>

        {success ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <IconCheck size={32} />
            </div>
            <h3 className="text-lg font-bold">تم التحديث بنجاح</h3>
            <p className="text-sm text-text-muted">
              جاري تحويلك للمنصة...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4.5" noValidate>
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-[13px] font-semibold">
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  dir="ltr"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  className={`h-12 w-full rounded-[10px] border bg-bg px-10 text-right text-sm text-text outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(108,99,255,0.12)] ${
                    error ? "border-accent-red" : "border-border focus:border-primary"
                  }`}
                />
                <IconLock size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="confirmPassword" className="text-[13px] font-semibold">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  dir="ltr"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError("");
                  }}
                  className={`h-12 w-full rounded-[10px] border bg-bg px-10 text-right text-sm text-text outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(108,99,255,0.12)] ${
                    error ? "border-accent-red" : "border-border focus:border-primary"
                  }`}
                />
                <IconLock size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              </div>
            </div>

            {error && (
              <span className="flex items-center gap-1 text-xs font-semibold text-accent-red">
                <IconAlertCircle size={14} /> {error}
              </span>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-12.5 items-center justify-center gap-2.5 rounded-[10px] bg-primary text-[15px] font-bold text-white transition-all duration-200 hover:bg-primary-dark hover:-translate-y-px active:scale-98 disabled:opacity-75"
            >
              {loading && <span className="h-4.5 w-4.5 animate-spin rounded-full border-2.5 border-white/40 border-t-white" />}
              {loading ? "جاري الحفظ..." : "حفظ كلمة المرور"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
