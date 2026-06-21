"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import { createClient } from "@/lib/supabase/client";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Verify the current session belongs to an admin (role checked server-side via RLS).
  const verifyAdmin = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAuthorized(false);
        return;
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setIsAuthorized(!profileError && profile?.role === "admin");
    } catch {
      setIsAuthorized(false);
    }
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
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError || profile?.role !== "admin") {
        // Not an admin: sign back out and deny access.
        await supabase.auth.signOut();
        setError("هذا الحساب لا يملك صلاحية الإدارة");
        return;
      }

      setIsAuthorized(true);
      setPassword("");
    } catch {
      setError("تعذّر تسجيل الدخول، حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

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
      <AdminSidebar open={open} onClose={() => setOpen(false)} />
      <main className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onMenuClick={() => setOpen(true)} />
        <div className="flex flex-col gap-5 p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
