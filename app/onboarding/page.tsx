"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { IconUser, IconPhone, IconDeviceMobile, IconAlertCircle } from "@tabler/icons-react";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  const [errors, setErrors] = useState({
    fullName: false,
    phone: false,
    parentPhone: false,
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

        // التأكد ما إذا كان الملف مكتملاً بالفعل
        const { data: profile } = await supabase
          .from("profiles")
          .select("parent_phone, role")
          .eq("id", uid)
          .single();

        if (profile && profile.parent_phone) {
          // الملف مكتمل، تحويله مباشرة
          window.location.href = profile.role === "admin" ? "/admin" : "/dashboard";
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

    const isNameValid = fullName.trim().length >= 3;
    // التحقق من أن أرقام الجوال تبدأ بـ 05 وتتكون من 10 أرقام
    const isPhoneValid = /^(05)[0-9]{8}$/.test(phone.trim());
    const isParentPhoneValid = /^(05)[0-9]{8}$/.test(parentPhone.trim());

    setErrors({
      fullName: !isNameValid,
      phone: !isPhoneValid,
      parentPhone: !isParentPhoneValid,
    });

    if (!isNameValid || !isPhoneValid || !isParentPhoneValid) return;
    if (!userId) return;

    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          fullName: fullName.trim(),
          phone: phone.trim(),
          parentPhone: parentPhone.trim(),
          role: "student", // الافتراضي للحسابات الجديدة
        })
      });

      const dataRes = await res.json();

      if (!res.ok) {
        throw new Error(dataRes.error || "فشل حفظ الملف الشخصي");
      }

      showToast("تم إكمال ملفك بنجاح! جاري تحويلك للمنصة...", "success");

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
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
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold">إكمال الملف الشخصي 📝</h1>
          <p className="text-sm text-text-muted">
            يرجى إدخال البيانات التالية لإكمال تفعيل حسابك (مهم جداً لنظام الإشعارات)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          {/* الاسم الكامل */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">الاسم الكامل (الرباعي)</label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors({ ...errors, fullName: false });
                }}
                placeholder="أحمد محمد خالد..."
                className={`h-12 w-full rounded-[10px] border bg-bg px-10 text-sm text-text outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(108,99,255,0.12)] ${
                  errors.fullName ? "border-accent-red" : "border-border focus:border-primary"
                }`}
              />
              <IconUser size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            </div>
            {errors.fullName && (
              <span className="flex items-center gap-1 text-xs text-accent-red">
                <IconAlertCircle size={14} /> يرجى إدخال اسمك الحقيقي بالكامل
              </span>
            )}
          </div>

          {/* رقم الجوال الخاص بالطالب */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">رقم الجوال الشخصي</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors({ ...errors, phone: false });
                }}
                placeholder="05XXXXXXXX"
                dir="ltr"
                className={`h-12 w-full rounded-[10px] border bg-bg px-10 text-right text-sm text-text outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(108,99,255,0.12)] ${
                  errors.phone ? "border-accent-red" : "border-border focus:border-primary"
                }`}
              />
              <IconDeviceMobile size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            </div>
            {errors.phone && (
              <span className="flex items-center gap-1 text-xs text-accent-red">
                <IconAlertCircle size={14} /> يجب أن يبدأ بـ 05 ويتكون من 10 أرقام
              </span>
            )}
          </div>

          {/* رقم جوال ولي الأمر (الأهم) */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">رقم واتساب ولي الأمر (لإرسال التقارير)</label>
            <div className="relative">
              <input
                type="tel"
                value={parentPhone}
                onChange={(e) => {
                  setParentPhone(e.target.value);
                  if (errors.parentPhone) setErrors({ ...errors, parentPhone: false });
                }}
                placeholder="05XXXXXXXX"
                dir="ltr"
                className={`h-12 w-full rounded-[10px] border bg-bg px-10 text-right text-sm text-text outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(108,99,255,0.12)] ${
                  errors.parentPhone ? "border-accent-red" : "border-border focus:border-primary"
                }`}
              />
              <IconPhone size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            </div>
            {errors.parentPhone && (
              <span className="flex items-center gap-1 text-xs text-accent-red">
                <IconAlertCircle size={14} /> يجب أن يبدأ بـ 05 ويتكون من 10 أرقام
              </span>
            )}
            <span className="text-xs text-text-muted">
              هذا الرقم سيُستخدم حصرياً لإرسال تقارير الأداء ومستويات الإتقان آلياً.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-12.5 items-center justify-center gap-2.5 rounded-[10px] bg-primary text-[15px] font-bold text-white transition-all hover:bg-primary-dark disabled:opacity-75"
          >
            {loading && <span className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {loading ? "جاري الحفظ..." : "حفظ والمتابعة للمنصة"}
          </button>
        </form>
      </div>
    </div>
  );
}

