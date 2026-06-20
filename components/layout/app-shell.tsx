"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";
import { useAuth } from "@/hooks/use-auth";
import { PlatformHydration } from "./platform-hydration";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile, isLoading } = useAuth();

  // Show loading spinner only for a max of 5 seconds to prevent infinite spinner
  const [forceReady, setForceReady] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setForceReady(true), 5000);
    return () => clearTimeout(timeout);
  }, []);

  // Redirect to login if not authenticated (after loading finishes)
  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = "/login";
    }
  }, [isLoading, user]);

  // Redirect to onboarding if profile is not complete
  useEffect(() => {
    if (!isLoading && user && profile === null) {
      // User exists but no profile - redirect to onboarding
      // But only after giving it a moment to load
      const timeout = setTimeout(() => {
        window.location.href = "/onboarding";
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, user, profile]);

  // Show spinner while loading (with safety timeout)
  if (isLoading && !forceReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/40 border-t-primary" />
          <span className="text-sm text-text-muted font-medium">جاري تحميل المنصة...</span>
        </div>
      </div>
    );
  }

  // No user at all - redirect will happen via useEffect
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/40 border-t-primary" />
          <span className="text-sm text-text-muted font-medium">جاري التحويل لتسجيل الدخول...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg text-text selection:bg-primary/20 selection:text-primary">
      {/* Hydrates store with DB content dynamically */}
      <PlatformHydration />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex flex-col gap-5 p-4 pb-24 md:p-6 md:pb-6">{children}</div>
      </main>

      <BottomNav />
    </div>
  );
}
