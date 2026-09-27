// scripts/cpanel-server.js — يُنسخ إلى جذر حزمة cPanel باسم server.js (نقطة دخول Passenger:
// Setup Node.js App → Application startup file). حزمة مبنية مسبقاً (next build مع output: "standalone")،
// فلا تحتاج npm install ولا next build على السيرفر.
//
// 1) يحمّل متغيرات البيئة من .env.production (ثم .env إن وُجد) في هذا المجلد، لأن خادم Next المستقل
//    لا يقرأ ملفات .env بنفسه. متغيرات Passenger (Environment variables في cPanel) لها الأولوية.
// 2) يشغّل خادم Next المولَّد (next-standalone.js). Passenger يعترض listen() فرقم المنفذ غير مهم.
process.env.NODE_ENV = "production";

const fs = require("fs");
const path = require("path");

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return 0;
  let loaded = 0;
  for (const raw of fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith("export ")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, ""); // تعليق في نهاية السطر (كما في dotenv)
    }
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = value;
      loaded++;
    }
  }
  return loaded;
}

const loadedProduction = loadEnvFile(path.join(__dirname, ".env.production"));
const loadedBase = loadEnvFile(path.join(__dirname, ".env"));
if (loadedProduction + loadedBase === 0 && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[server] لم يُعثر على .env.production ولا متغيرات بيئة في Passenger؛ بعض المزايا (الإشعارات، لوحة الإدارة) لن تعمل.");
}

// الحزمة المبنية مسبقاً لا تقرأ NEXT_PUBLIC_SITE_URL وقت التشغيل (دُمجت فارغة عند البناء)؛ نقبلها كاسم بديل لـ SITE_URL.
if (!process.env.SITE_URL && process.env.NEXT_PUBLIC_SITE_URL) {
  process.env.SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
}
if (!/^https?:\/\/[^/\s]+$/i.test((process.env.SITE_URL || "").trim().replace(/\/+$/, ""))) {
  console.error("[server] SITE_URL غير مضبوط أو بصيغة خاطئة؛ ضعه في .env.production بالشكل https://your-domain.com (بدون مسار أو شرطة أخيرة؛ يُستخدم في رابط التحقق من الشهادة).");
}

// تحت Passenger لا يُفتح أي منفذ TCP (listen() يُعترض)، لكن Next يبني عنوانه الداخلي من PORT
// (http://0.0.0.0:PORT) ليستدعي نفسه عند تمرير Server Action إلى صفحة أخرى أو عند redirect داخل Action.
// المنفذ الافتراضي 3000 قد يكون مشغولاً بتطبيق جار على استضافة مشتركة، فنجعل الاستدعاء يفشل سريعاً بدل ذلك
// (Next يعود حينها إلى تحويل عادي في المتصفح).
if (typeof PhusionPassenger !== "undefined" && !process.env.PORT) {
  process.env.PORT = "39999";
}

// Passenger يتجاهل المضيف/المنفذ، لكن عند التشغيل اليدوي (node server.js) نربط بكل الواجهات لا باسم الجهاز.
if (!process.env.HOSTNAME || !/^(0\.0\.0\.0|127\.0\.0\.1|localhost|::1?)$/.test(process.env.HOSTNAME)) {
  process.env.HOSTNAME = "0.0.0.0";
}

require("./next-standalone.js");
