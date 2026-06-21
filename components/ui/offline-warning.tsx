"use client";

import { useState, useEffect } from "react";
import { IconWifiOff } from "@tabler/icons-react";

export function OfflineWarning() {
  const [isOffline, setIsOffline] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    function handleOnline() { setIsOffline(false); }
    function handleOffline() { setIsOffline(true); }

    // Initial check
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!mounted || !isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none p-4">
      <div className="bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-down border border-red-400/50">
        <div className="bg-white/20 p-2 rounded-xl">
          <IconWifiOff size={20} className="animate-pulse" />
        </div>
        <div className="flex flex-col" dir="rtl">
          <span className="font-black text-sm">أنت في وضع عدم الاتصال</span>
          <span className="text-xs font-semibold text-white/80">يرجى الاتصال بالإنترنت لتحديث البيانات، بعض المميزات تعمل محلياً مؤقتاً.</span>
        </div>
      </div>
    </div>
  );
}
