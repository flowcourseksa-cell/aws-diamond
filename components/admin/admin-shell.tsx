"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import { useAuth } from "@/hooks/use-auth";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, profile, isLoading } = useAuth();

  // Safety net: never let the admin portal hang on a spinner forever.
  const [forceReady, setForceReady] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setForceReady(true), 6000);
    return () => clearTimeout(timeout);
  }, []);

  // Redirect to login if auth settled and there is no user at all.
  useEffect(() => {
    if ((!isLoading || forceReady) && !user) {
      window.location.href = "/login";
    }
  }, [isLoading, forceReady, user]);

  // If loading, show spinner (capped by forceReady)
  if (isLoading && !forceReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/40 border-t-primary" />
      </div>
    );
  }

  // If not admin, show access denied
  if (!profile || profile.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg gap-4">
        <h1 className="text-2xl font-bold text-accent-red">لا تملك صلاحيات الدخول!</h1>
        <p className="text-text-muted">هذه الصفحة مخصصة لمدير النظام فقط.</p>
        <button onClick={() => window.location.href = "/"} className="h-10 rounded-xl bg-primary px-6 text-sm font-bold text-white">العودة للرئيسية</button>
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

