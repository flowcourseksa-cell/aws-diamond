"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

/**
 * يُركَّب في التخطيط الجذري: عند تسجيل دخول مستخدم على متصفح لديه اشتراك إشعارات دفع سابق،
 * يعيد ربط الاشتراك بالمستخدم الحالي على الخادم (upsert على نقطة الاشتراك). بدون ذلك يبقى الاشتراك
 * باسم آخر من استخدم الجهاز، فتصله إشعاراته ولا تصل إشعارات المستخدم الجديد.
 */
export default function PushRebind() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || typeof navigator === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    let cancelled = false;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (!sub || cancelled) return;
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        });
      } catch {
        // لا شيء: الإشعارات ميزة إضافية
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return null;
}
