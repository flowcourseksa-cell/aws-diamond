// server.js — نقطة دخول Passenger على استضافة cPanel (Setup Node.js App → Application startup file).
// Vercel لا يستخدم هذا الملف. محلياً يمكن تجربته بعد `npm run build` عبر: node server.js
//
// ملاحظات مهمة:
// - يجب ضبط NODE_ENV قبل require("next") لأن Next يختار نسخ الإنتاج من React بناءً عليه، لا على خيار dev.
// - webpack: true لأن المشروع يُبنى بـ `next build --webpack` (Serwist لا يدعم Turbopack).
// - Passenger يعترض استدعاء listen() ويربطه بمقبسه الخاص، فرقم المنفذ غير مهم على السيرفر.
process.env.NODE_ENV = "production";

const http = require("http");
const next = require("next");

const port = Number(process.env.PORT) || 3000;
const app = next({ dev: false, dir: __dirname, webpack: true });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = http.createServer((req, res) => handle(req, res));

    server.listen(port, () => {
      console.log(`[server] ready ${new Date().toISOString()} (port ${port})`);
    });

    const shutdown = (signal) => {
      console.log(`[server] ${signal} received, closing`);
      server.close(() => process.exit(0));
      if (typeof server.closeIdleConnections === "function") server.closeIdleConnections();
      setTimeout(() => process.exit(0), 10_000).unref();
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  })
  .catch((err) => {
    console.error("[server] failed to start", err);
    process.exit(1); // ليُبلّغ Passenger عن الخطأ فوراً بدل انتظار مهلة الإقلاع
  });
