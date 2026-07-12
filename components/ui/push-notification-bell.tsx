"use client";

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { IconBell, IconBellOff, IconBellRinging } from "@tabler/icons-react";

export function PushNotificationBell() {
  const { permission, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();

  // Don't render on SSR or if push not supported
  if (typeof window === "undefined" || !("serviceWorker" in window) || !("PushManager" in window)) {
    return null;
  }

  if (permission === "denied") {
    return (
      <div className="relative group">
        <button
          disabled
          className="p-2 rounded-xl bg-bg border border-border text-text-muted opacity-50 cursor-not-allowed"
          title="الإشعارات محظورة في إعدادات المتصفح"
        >
          <IconBellOff size={20} />
        </button>
        <div className="absolute top-full mt-2 right-0 bg-card border border-border rounded-xl p-3 text-xs font-semibold text-text-muted whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
          الإشعارات محظورة — افتح إعدادات المتصفح لتفعيلها
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      className={`relative p-2 rounded-xl border transition-all ${
        isSubscribed
          ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
          : "bg-bg border-border text-text-muted hover:text-primary hover:border-primary/30"
      } ${isLoading ? "opacity-60 cursor-wait" : ""}`}
      title={isSubscribed ? "إيقاف الإشعارات" : "تفعيل الإشعارات"}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isSubscribed ? (
        <>
          <IconBellRinging size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </>
      ) : (
        <IconBell size={20} />
      )}
    </button>
  );
}
