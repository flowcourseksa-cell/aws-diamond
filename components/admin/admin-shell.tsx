"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if authorized
    const auth = localStorage.getItem("admin_secret_token");
    if (auth === "authorized") {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "0000") {
      localStorage.setItem("admin_secret_token", "authorized");
      setIsAuthorized(true);
      setError("");
    } else {
      setError("الرقم السري غير صحيح");
    }
  };

  if (isAuthorized === null) {
    return null; // Loading state
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg gap-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
          <h1 className="mb-6 text-center text-2xl font-bold text-text">بوابة الإدارة السرية</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="أدخل الرمز السري..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-bg px-4 text-center text-lg text-text focus:border-primary focus:outline-none"
              autoFocus
            />
            {error && <p className="text-center text-sm text-accent-red">{error}</p>}
            <button
              type="submit"
              className="h-12 w-full rounded-xl bg-primary text-base font-bold text-white hover:bg-primary/90"
            >
              دخول
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

