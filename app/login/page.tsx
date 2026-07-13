// @ts-nocheck
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import {
  IconSchool,
  IconMoon,
  IconSun,
  IconEye,
  IconEyeOff,
  IconAlertCircle,
  IconUser,
  IconDeviceMobile,
  IconPhone,
  IconArrowRight,
} from "@tabler/icons-react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

function isValidEmailOrPhone(value: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^(05|5)[0-9]{8}$/;
  return emailRegex.test(value) || phoneRegex.test(value.replace(/\s/g, ""));
}

// Static positions — defined once outside component to prevent re-render jumps
const STATIC_DOTS = [
  {cx:45,cy:120,r:2.1},{cx:210,cy:340,r:1.4},{cx:88,cy:670,r:2.8},{cx:390,cy:55,r:1.9},
  {cx:145,cy:820,r:1.2},{cx:470,cy:230,r:2.5},{cx:30,cy:450,r:1.7},{cx:320,cy:780,r:2.2},
  {cx:195,cy:190,r:1.5},{cx:410,cy:600,r:2.0},{cx:75,cy:295,r:2.3},{cx:290,cy:870,r:1.1},
  {cx:155,cy:510,r:2.7},{cx:380,cy:150,r:1.6},{cx:60,cy:730,r:2.0},{cx:440,cy:400,r:1.3},
  {cx:115,cy:90,r:2.4},{cx:350,cy:560,r:1.8},{cx:235,cy:680,r:2.1},{cx:490,cy:320,r:1.5},
  {cx:20,cy:580,r:2.6},{cx:270,cy:440,r:1.9},{cx:425,cy:760,r:2.3},{cx:100,cy:205,r:1.4},
  {cx:365,cy:890,r:2.0},{cx:180,cy:395,r:1.7},{cx:455,cy:130,r:2.2},{cx:50,cy:830,r:1.3},
  {cx:300,cy:270,r:2.5},{cx:140,cy:630,r:1.6},{cx:480,cy:490,r:1.2},{cx:85,cy:160,r:2.8},
  {cx:245,cy:750,r:1.5},{cx:420,cy:350,r:2.0},{cx:165,cy:485,r:2.3},{cx:335,cy:60,r:1.8},
  {cx:10,cy:370,r:1.4},{cx:260,cy:900,r:2.6},{cx:395,cy:215,r:1.1},{cx:120,cy:545,r:2.2},
  {cx:465,cy:680,r:1.7},{cx:35,cy:265,r:2.4},{cx:280,cy:130,r:1.9},{cx:215,cy:595,r:1.5},
  {cx:445,cy:850,r:2.1},{cx:95,cy:405,r:1.3},{cx:370,cy:480,r:2.7},{cx:170,cy:770,r:1.6},
  {cx:310,cy:200,r:2.0},{cx:55,cy:650,r:1.8},{cx:430,cy:545,r:2.3},{cx:200,cy:80,r:1.2},
  {cx:340,cy:710,r:2.5},{cx:125,cy:330,r:1.7},{cx:475,cy:890,r:1.4},{cx:75,cy:180,r:2.2},
  {cx:255,cy:430,r:1.9},{cx:415,cy:720,r:2.1},{cx:185,cy:285,r:1.5},{cx:495,cy:560,r:2.8},
];

// Static positions — defined once outside component to prevent re-render jumps

export default function LoginPage() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passError, setPassError] = useState(false);
  const [confirmPassError, setConfirmPassError] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [parentPhoneError, setParentPhoneError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null); // لعرض شاشة تأكيد الإيميل
  const supabase = createClient();

  // ── Google OAuth ──────────────────────────────────────────────
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    
    // Use createBrowserClient to ensure PKCE flow is used for OAuth with SSR callbacks
    const { createBrowserClient } = await import('@supabase/ssr');
    const authClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: 'pkce',
        }
      }
    );
    
    const { error } = await authClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "select_account", // يطلب اختيار حساب في كل مرة
        },
      },
    });
    if (error) {
      showToast("حدث خطأ أثناء تسجيل الدخول بجوجل. حاول مرة أخرى", "error");
      setGoogleLoading(false);
    }
    // لو نجح، المستخدم هيتحول تلقائياً لجوجل — مش هيرجع هنا
  }


  useEffect(() => {
    setMounted(true);
    // تنظيف الرابط من أي token قديم عالق من محاولات سابقة
    if (window.location.hash && window.location.hash.includes("access_token")) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    // التحقق مما إذا كان المستخدم قد سجل الدخول للتو (مثلاً عبر Google Implicit Flow)
    const checkSession = async (session: any) => {
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, parent_phone")
          .eq("id", session.user.id)
          .single();

        if (!profile || !profile.parent_phone) {
          window.location.href = "/onboarding";
        } else {
          const redirect = localStorage.getItem("flow-redirect-after-login");
          localStorage.removeItem("flow-redirect-after-login");
          window.location.href = profile.role === "admin" ? "/admin-khaled-ksa-aws-2026-org" : (redirect || "/");
        }
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) checkSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        checkSession(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const emailValid = isValidEmailOrPhone(emailOrPhone.trim());
    const passValid = password.length >= 6;
    const nameValid = !isRegistering || fullName.trim().length >= 2;
    const confirmValid = !isRegistering || confirmPassword === password;
    const saudiPhoneRegex = /^05[0-9]{8}$/;
    const phoneValid = !isRegistering || phone.trim() === "" || saudiPhoneRegex.test(phone.trim());
    const parentPhoneValid = !isRegistering || saudiPhoneRegex.test(parentPhone.trim());

    setEmailError(!emailValid);
    setPassError(!passValid);
    setNameError(!nameValid);
    setConfirmPassError(!confirmValid);
    setPhoneError(!phoneValid);
    setParentPhoneError(!parentPhoneValid);

    if (!emailValid || !passValid || !nameValid || !confirmValid || !phoneValid || !parentPhoneValid) return;

    setLoading(true);
    
    try {
      if (isRegistering) {
        // ── الخطوة 1: التحقق من أن الإيميل مش موجود ──
        const checkRes = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailOrPhone.trim() }),
        });
        const checkData = await checkRes.json();
        if (checkData.exists) {
          throw new Error("هذا الحساب مسجل لدينا بالفعل، يرجى تسجيل الدخول أو استخدام بريد آخر");
        }

        // ── الخطوة 2: إنشاء الحساب عبر Supabase (يبعت إيميل تأكيد تلقائياً) ──
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: emailOrPhone.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: fullName.trim(),
            }
          },
        });

        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error("فشل إنشاء الحساب، يرجى المحاولة لاحقاً");

        // ── الخطوة 3: حفظ الملف الشخصي (باستخدام service role) ──
        await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: signUpData.user.id,
            fullName: fullName.trim(),
            phone: phone.trim(),
            parentPhone: parentPhone.trim(),
            role: "student",
          }),
        });

        // ── الخطوة 4: إذا كان التأكيد مطفياً → ادخله مباشرة ──
        if (signUpData.session) {
          showToast(`أهلاً ${fullName.trim()}! مرحباً بك في المنصة 🎉`, "success");
          setTimeout(() => { window.location.href = "/"; }, 1000);
        } else {
          // التأكيد مفعّل → اعرض شاشة "افحص بريدك"
          setRegisteredEmail(emailOrPhone.trim());
          setLoading(false);
        }
      } else {
        // --- تسجيل الدخول (Sign In) ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailOrPhone.trim(),
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('بيانات الدخول غير صحيحة، تأكد من البريد وكلمة المرور');
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('يرجى تأكيد بريدك الإلكتروني أولاً — افحص صندوق الوارد واضغط على رابط التأكيد');
          }
          throw error;
        }

        // التحقق من وجود الملف الشخصي، إذا لم يكن موجوداً يذهب لـ onboarding
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, parent_phone")
          .eq("id", data.user.id)
          .single();

        if (!profile || !profile.parent_phone) {
          showToast("يرجى إكمال ملفك الشخصي أولاً", "warning");
          window.location.href = "/onboarding";
          return;
        }

        const isAdmin = profile.role === "admin";

        showToast(
          isAdmin ? "مرحباً بك مدير الأوس الماسية! جاري التحويل..." : "تم تسجيل الدخول بنجاح، جاري التحويل...",
          "success"
        );
        setTimeout(() => {
          const redirect = localStorage.getItem("flow-redirect-after-login");
          localStorage.removeItem("flow-redirect-after-login");
          window.location.href = isAdmin ? "/admin-khaled-ksa-aws-2026-org" : (redirect || "/");
        }, 600);
      }
    } catch (err: any) {
      showToast(err.message || "حدث خطأ غير متوقع", "error");
      setLoading(false);
    }
  }


  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg">
      {/* الشكل الهندسي الخلفي */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="xMinYMid slice" className="h-full w-full">
          {STATIC_DOTS.map((dot, i) => (
            <circle key={i} cx={dot.cx} cy={dot.cy} r={dot.r} className="fill-primary opacity-8" />
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

      {/* زر العودة للرئيسية */}
      <Link
        href="/"
        className="absolute right-6 top-6 z-2 flex items-center gap-2 h-10.5 px-4 rounded-[10px] border border-border bg-card text-text transition-transform duration-200 hover:-translate-y-0.5 text-sm font-bold"
      >
        العودة للرئيسية
        <IconArrowRight size={18} />
      </Link>

      {/* البطاقة */}
      <div className="fade-up relative z-1 w-[420px] max-w-[92vw] rounded-[20px] border border-border bg-card p-10 shadow-[0_10px_40px_rgba(15,17,23,0.06)] sm:p-9">
        <div className="mb-7 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f97316] to-[#ea580c] shadow-lg shadow-orange-500/20 text-white">
            <IconSchool size={34} stroke={2.5} />
          </div>
          <div className="text-[24px] font-black tracking-tight text-text">الأوس الماسية</div>
          <div className="text-xs font-semibold tracking-widest text-text-muted">
            EDUCATION PLATFORM
          </div>
        </div>

        {/* ── شاشة تأكيد الإيميل بعد التسجيل ── */}
        {registeredEmail ? (
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="mb-2 text-xl font-bold">تحقق من بريدك الإلكتروني 📬</h2>
              <p className="text-[13.5px] leading-relaxed text-text-muted">
                أرسلنا رابط تأكيد إلى
              </p>
              <p className="mt-1 font-bold text-primary" dir="ltr">{registeredEmail}</p>
              <p className="mt-2 text-[13px] text-text-muted">
                اضغط على الرابط في الإيميل لتفعيل حسابك، ثم سجّل دخولك.
              </p>
            </div>
            <div className="h-px w-full bg-border" />
            <p className="text-[12.5px] text-text-muted">لم يصلك الإيميل؟ افحص مجلد البريد المزعج (Spam)</p>
            <ResendButton email={registeredEmail} supabase={supabase} />

            <button
              type="button"
              onClick={() => { setRegisteredEmail(null); setIsRegistering(false); }}
              className="h-12 w-full rounded-[10px] bg-primary text-[15px] font-bold text-white transition-all hover:bg-primary-dark"
            >
              العودة لتسجيل الدخول
            </button>
          </div>
        ) : (
          <>

        <h1 className="mb-1.5 text-center text-[22px] font-bold">
          {isRegistering ? "إنشاء حساب جديد ✨" : "مرحباً بك مجدداً 👋"}
        </h1>
        <p className="mb-7 text-center text-[13.5px] text-text-muted">
          {isRegistering 
            ? "أدخل بياناتك لإنشاء حساب جديد" 
            : "سجّل دخولك لمتابعة رحلتك نحو التميز"}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4.5" noValidate>
          {/* الاسم الكامل — يظهر فقط عند التسجيل */}
          {isRegistering && (
            <div className="flex flex-col gap-2">
              <label htmlFor="fullName" className="text-[13px] font-semibold">الاسم الكامل</label>
              <div className="relative">
                <input
                  id="fullName"
                  type="text"
                  placeholder="أحمد محمد..."
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); if (nameError) setNameError(false); }}
                  className={`h-12 w-full rounded-[10px] border bg-bg px-10 text-sm text-text outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(108,99,255,0.12)] ${
                    nameError ? "border-accent-red" : "border-border focus:border-primary"
                  }`}
                />
                <IconUser size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              </div>
              {nameError && (
                <span className="flex items-center gap-1 text-xs font-semibold text-accent-red">
                  <IconAlertCircle size={14} /> يرجى إدخال اسمك الكامل
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="emailOrPhone" className="text-[13px] font-semibold">
              البريد الإلكتروني {!isRegistering && "أو رقم الجوال"}
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
                <IconAlertCircle size={14} /> الرجاء إدخال بريد إلكتروني صحيح
              </span>
            )}
          </div>

          {/* رقم جوال الطالب — يظهر فقط عند التسجيل */}
          {isRegistering && (
            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="text-[13px] font-semibold">رقم جوال الطالب <span className="text-[11px] font-normal text-text-muted">(اختياري)</span></label>
              <div className="relative">
                <input
                  id="phone"
                  type="tel"
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); if (phoneError) setPhoneError(false); }}
                  className={`h-12 w-full rounded-[10px] border bg-bg px-10 text-right text-sm text-text outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(108,99,255,0.12)] ${
                    phoneError ? "border-accent-red" : "border-border focus:border-primary"
                  }`}
                />
                <IconDeviceMobile size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              </div>
              {phoneError && (
                <span className="flex items-center gap-1 text-xs font-semibold text-accent-red">
                  <IconAlertCircle size={14} /> يجب أن يبدأ بـ 05 ويتكون من 10 أرقام
                </span>
              )}
            </div>
          )}

          {/* رقم جوال ولي الأمر — يظهر فقط عند التسجيل */}
          {isRegistering && (
            <div className="flex flex-col gap-2">
              <label htmlFor="parentPhone" className="text-[13px] font-semibold">
                رقم واتساب ولي الأمر
                <span className="mr-1 text-[11px] font-normal text-primary">(مهم — لإرسال التقارير)</span>
              </label>
              <div className="relative">
                <input
                  id="parentPhone"
                  type="tel"
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                  value={parentPhone}
                  onChange={(e) => { setParentPhone(e.target.value); if (parentPhoneError) setParentPhoneError(false); }}
                  className={`h-12 w-full rounded-[10px] border bg-bg px-10 text-right text-sm text-text outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(108,99,255,0.12)] ${
                    parentPhoneError ? "border-accent-red" : "border-border focus:border-primary"
                  }`}
                />
                <IconPhone size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              </div>
              {parentPhoneError && (
                <span className="flex items-center gap-1 text-xs font-semibold text-accent-red">
                  <IconAlertCircle size={14} /> يجب أن يبدأ بـ 05 ويتكون من 10 أرقام
                </span>
              )}
              <span className="text-[11.5px] text-text-muted">سيُستخدم حصرياً لإرسال تقارير الأداء لولي الأمر آلياً.</span>
            </div>
          )}


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

          {/* تأكيد كلمة المرور — يظهر فقط عند التسجيل */}
          {isRegistering && (
            <div className="flex flex-col gap-2">
              <label htmlFor="confirmPassword" className="text-[13px] font-semibold">تأكيد كلمة المرور</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  dir="ltr"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); if (confirmPassError) setConfirmPassError(false); }}
                  className={`h-12 w-full rounded-[10px] border bg-bg px-4 text-sm text-text outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(108,99,255,0.12)] ${
                    confirmPassError ? "border-accent-red" : "border-border focus:border-primary"
                  }`}
                />
              </div>
              {confirmPassError && (
                <span className="flex items-center gap-1 text-xs font-semibold text-accent-red">
                  <IconAlertCircle size={14} /> كلمتا المرور غير متطابقتين
                </span>
              )}
            </div>
          )}


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
            {!isRegistering && (
              <a href="/forgot-password" className="font-semibold text-primary transition-colors duration-200 hover:text-primary-dark">
                نسيت كلمة المرور؟
              </a>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-12.5 items-center justify-center gap-2.5 rounded-[10px] bg-primary text-[15px] font-bold text-white transition-all duration-200 hover:bg-primary-dark hover:-translate-y-px active:scale-98 disabled:opacity-75"
          >
            {loading && (
              <span className="h-4.5 w-4.5 animate-spin rounded-full border-2.5 border-white/40 border-t-white" />
            )}
            {loading ? "جاري المعالجة..." : (isRegistering ? "إنشاء الحساب" : "تسجيل الدخول")}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-[12.5px] font-semibold text-text-muted">
          <span className="h-px flex-1 bg-border" />
          {isRegistering ? "أو التسجيل بواسطة" : "أو الدخول بواسطة"}
          <span className="h-px flex-1 bg-border" />
        </div>

        {/* ✨ زرار Google الحقيقي */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="flex h-12.5 w-full items-center justify-center gap-3 rounded-[10px] border-[1.5px] border-border bg-card text-[14px] font-bold text-text transition-all duration-200 hover:-translate-y-px hover:border-primary hover:shadow-md active:scale-98 disabled:opacity-60"
        >
          {googleLoading ? (
            <span className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-border border-t-primary" />
          ) : (
            <svg viewBox="0 0 48 48" className="h-5 w-5 shrink-0" aria-hidden="true">
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            </svg>
          )}
          {googleLoading ? "جاري التحويل لجوجل..." : "المتابعة بحساب Google"}
        </button>

        <div className="mt-7 text-center">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-[13.5px] font-semibold text-text-muted transition-colors duration-200 hover:text-primary"
          >
            {isRegistering ? (
              <>لديك حساب بالفعل؟ <span className="text-primary">تسجيل الدخول</span></>
            ) : (
              <>ليس لديك حساب؟ <span className="text-primary">إنشاء حساب جديد</span></>
            )}
          </button>
        </div>

        <p className="mt-7 text-center text-[11.5px] text-text-muted">
          © 2026 منصة الأوس الماسية التعليمية — جميع الحقوق محفوظة
        </p>
        </>
        )}
      </div>
    </div>
  );
}

