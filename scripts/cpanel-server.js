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
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
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
if (!process.env.SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL) {
  console.error("[server] SITE_URL غير مضبوط؛ ضعه في .env.production بالشكل https://your-domain.com (يُستخدم في رابط التحقق من الشهادة).");
}

// Passenger يتجاهل المضيف/المنفذ، لكن عند التشغيل اليدوي (node server.js) نربط بكل الواجهات لا باسم الجهاز.
if (!process.env.HOSTNAME || !/^(0\.0\.0\.0|127\.0\.0\.1|localhost|::1?)$/.test(process.env.HOSTNAME)) {
  process.env.HOSTNAME = "0.0.0.0";
}

require("./next-standalone.js");
