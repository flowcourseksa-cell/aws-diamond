// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import { createClient } from "@/lib/supabase/client";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true); // desktop: starts open
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [adminLevel, setAdminLevel] = useState<string>("super");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const pathname = usePathname();
  const router = useRouter();

  // Close sidebar by default on mobile screens
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setOpen(false);
    }
  }, []);
  const verifyAdmin = useCallback(async () => {
    // Only allow bypass if they specifically unlocked the admin panel in this session
    if (typeof window !== "undefined" && sessionStorage.getItem("admin_unlocked") === "true") {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("role, admin_level").eq("id", user.id).single();
          if (profile?.role === "admin") {
            setAdminLevel(profile?.admin_level || "super");
            setIsAuthorized(true);
            return;
          }
        }
      } catch {}
    }
    setIsAuthorized(false);
  }, []);

  useEffect(() => {
    verifyAdmin();
  }, [verifyAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError || !data.user) {
        setError("بيانات الدخول غير صحيحة");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, admin_level")
        .eq("id", data.user.id)
        .single();

      if (profileError || profile?.role !== "admin") {
        await supabase.auth.signOut();
        setError("هذا الحساب لا يملك صلاحية الإدارة");
        return;
      }

      sessionStorage.setItem("admin_unlocked", "true");
      setAdminLevel(profile?.admin_level || "super");
      setIsAuthorized(true);
      setPassword("");
    } catch {
      setError("تعذّر تسجيل الدخول، حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  // Protect sensitive routes
  useEffect(() => {
    if (isAuthorized && adminLevel === "content") {
      const restrictedPaths = ["/students", "/activations", "/pricing", "/parent-notifications", "/settings", "/whatsapp"];
      if (restrictedPaths.some(p => pathname.includes(p)) && pathname !== "/admin-khaled-ksa-aws-2026-org") {
        router.replace("/admin-khaled-ksa-aws-2026-org");
      }
    }
  }, [isAuthorized, adminLevel, pathname, router]);

  if (isAuthorized === null) {
    return null; // Loading state
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg gap-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
          <h1 className="mb-6 text-center text-2xl font-bold text-text">بوابة الإدارة</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="البريد الإلكتروني للمدير"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-bg px-4 text-center text-lg text-text focus:border-primary focus:outline-none"
              autoComplete="email"
              autoFocus
            />
            <input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-bg px-4 text-center text-lg text-text focus:border-primary focus:outline-none"
              autoComplete="current-password"
            />
            {error && <p className="text-center text-sm text-accent-red">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-xl bg-primary text-base font-bold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? "جاري التحقق..." : "دخول"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar open={open} onClose={() => setOpen(false)} adminLevel={adminLevel} />
      <main className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onMenuClick={() => setOpen(prev => !prev)} sidebarOpen={open} />
        <div className="flex flex-col gap-5 p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}