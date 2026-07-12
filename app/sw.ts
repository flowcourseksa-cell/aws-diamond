/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, CacheFirst, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const SUPABASE_URL = "tdzzsmwvmddhypaoequv.supabase.co";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // ── Supabase REST API: NetworkFirst (try server, fallback to cache)
    // Covers: tracks, lessons, exams, files, enrollments, skill_progress
    {
      matcher: ({ url }) =>
        url.hostname === SUPABASE_URL && url.pathname.startsWith("/rest/v1/"),
      handler: new NetworkFirst({
        cacheName: "supabase-api-cache",
        networkTimeoutSeconds: 6,
        plugins: [
          {
            // Cache for 30 minutes
            cacheWillUpdate: async ({ response }) => {
              if (response && response.status === 200) return response;
              return null;
            },
          },
        ],
      }),
    },

    // ── Supabase Storage (cover images, files): CacheFirst
    {
      matcher: ({ url }) =>
        url.hostname === SUPABASE_URL && url.pathname.startsWith("/storage/"),
      handler: new CacheFirst({
        cacheName: "supabase-storage-cache",
        plugins: [],
      }),
    },

    // ── Next.js static assets: CacheFirst (they are hashed)
    {
      matcher: ({ url }) => url.pathname.startsWith("/_next/static/"),
      handler: new CacheFirst({
        cacheName: "next-static-cache",
      }),
    },

    // ── Google Fonts & other CDN assets
    {
      matcher: ({ url }) =>
        url.hostname === "fonts.googleapis.com" ||
        url.hostname === "fonts.gstatic.com",
      handler: new StaleWhileRevalidate({
        cacheName: "google-fonts-cache",
      }),
    },

    // ── Fallback to defaultCache for everything else
    ...defaultCache,
  ],
});

serwist.addEventListeners();

// ── Push Notification Handler ──────────────────────────────
self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  let payload: any = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "الأوس الماسية", body: event.data.text() };
  }

  const { title = "الأوس الماسية", body = "", icon, badge, url } = payload;

  event.waitUntil(
    (self as any).registration.showNotification(title, {
      body,
      icon: icon || "/icon-192x192.png",
      badge: badge || "/icon-192x192.png",
      dir: "rtl",
      lang: "ar",
      data: { url: url || "/dashboard" },
      vibrate: [200, 100, 200],
    })
  );
});

// ── Notification Click: open the app ──────────────────────
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    (self as any).clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients: any[]) => {
        // If app already open, focus it and navigate
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        // Otherwise open a new window
        if ((self as any).clients.openWindow) {
          return (self as any).clients.openWindow(targetUrl);
        }
      })
  );
});
