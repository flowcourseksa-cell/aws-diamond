// scripts/package-cpanel.mjs — تجميع حزمة التشغيل الجاهزة لاستضافة cPanel (بدون بناء أو npm على السيرفر).
//
// الاستخدام (من جذر المشروع، بعد وضع .env.production بقيم الإنتاج في الجذر):
//   NEXT_OUTPUT_STANDALONE=1 NODE_ENV=production npm run build
//   node scripts/package-cpanel.mjs            # ينتج مجلد dist-cpanel/ جاهزاً للضغط والرفع
//
// المجلد الناتج هو "جذر التطبيق" على cPanel: يُرفع محتواه (وليس المجلد نفسه) إلى Application root،
// وملف الإقلاع server.js. راجع DEPLOY_CPANEL.md (الطريقة أ).
import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";

const root = resolve(process.cwd());
const standalone = join(root, ".next", "standalone");
const out = join(root, "dist-cpanel");

function fail(msg) {
  console.error("✗ " + msg);
  process.exit(1);
}

if (!existsSync(join(standalone, "server.js"))) {
  fail(".next/standalone/server.js غير موجود. ابنِ أولاً: NEXT_OUTPUT_STANDALONE=1 NODE_ENV=production npm run build\n" +
    "  (إن وُجد المجلد لكن server.js داخل مسار متداخل فالسبب outputFileTracingRoot؛ يجب أن يساوي مجلد المشروع)");
}
if (!existsSync(join(root, "public", "sw.js"))) fail("public/sw.js غير موجود: Serwist لم يُبنَ (تأكد من NODE_ENV=production أثناء البناء)");
if (!existsSync(join(root, ".next", "static"))) fail(".next/static غير موجود");
if (!existsSync(join(root, "scripts", "cpanel-server.js"))) fail("scripts/cpanel-server.js غير موجود");

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// 1) ناتج standalone (الخادم + الحزم اللازمة وقت التشغيل فقط)
cpSync(standalone, out, { recursive: true });
// 2) الملفات الثابتة التي لا ينسخها Next تلقائياً (انظر وثائق output: "standalone")
cpSync(join(root, "public"), join(out, "public"), { recursive: true });
cpSync(join(root, ".next", "static"), join(out, ".next", "static"), { recursive: true });
// 3) خادم Next المولَّد يصبح next-standalone.js، وserver.js هو غلاف Passenger الذي يحمّل .env.production
renameSync(join(out, "server.js"), join(out, "next-standalone.js"));
cpSync(join(root, "scripts", "cpanel-server.js"), join(out, "server.js"));
// 4) لا أسرار من هنا: Next ينسخ ملفات .env إلى standalone، ونحذفها؛ .env.production يُضاف عند الإصدار
for (const envFile of [".env", ".env.local", ".env.production", ".env.production.local", ".env.development"]) {
  rmSync(join(out, envFile), { force: true });
}
// 5) sharp يُتتبَّع مع Next لمحسّن الصور، لكن images.unoptimized يعطّله؛ ثنائياته خاصة بنظام جهاز البناء
//    (مثل @img/sharp-win32-x64) ولا تعمل على Linux، فنحذفها (نحو 20MB).
for (const dir of ["sharp", "@img"]) rmSync(join(out, "node_modules", dir), { recursive: true, force: true });
// 6) بيان الإجراءات (server actions) يحوي مسارات مطلقة من جهاز البناء في الحقل filename (يُستخدم في سجلات التطوير فقط)؛
//    نجعلها نسبية حتى لا تحمل الحزمة مسارات الجهاز.
const manifestPath = join(out, ".next", "server", "server-reference-manifest.json");
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  let rewritten = 0;
  for (const runtime of ["node", "edge"]) {
    for (const entry of Object.values(manifest[runtime] || {})) {
      if (typeof entry.filename !== "string") continue;
      const idx = entry.filename.indexOf(root);
      if (idx === -1) continue;
      entry.filename = relative(root, entry.filename.slice(idx)).split(sep).join("/");
      rewritten++;
    }
  }
  writeFileSync(manifestPath, JSON.stringify(manifest));
  if (rewritten) console.log(`  · طُبّعت ${rewritten} مساراً في server-reference-manifest.json`);
}

const buildId = readFileSync(join(root, ".next", "BUILD_ID"), "utf8").trim();
writeFileSync(join(out, "BUILD_INFO.txt"), `build_id=${buildId}\nbuilt_at=${new Date().toISOString()}\nnode=${process.version}\n`);
console.log(`✓ dist-cpanel جاهز (BUILD_ID ${buildId}) — ارفع محتوياته إلى جذر التطبيق على cPanel`);
