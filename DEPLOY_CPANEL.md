# نشر المنصة على استضافة cPanel (Node.js / Passenger)

هذا الدليل يخص الاستضافة الذاتية على cPanel. قاعدة البيانات والمصادقة والتخزين تبقى على Supabase بلا أي تغيير.
الكود يعمل أيضاً على Vercel كما هو؛ `server.js` يُستخدم على cPanel فقط.

## 1. متطلبات الاستضافة (تأكد منها قبل البدء)

| المتطلب | الحد الأدنى |
|---------|-------------|
| Setup Node.js App (CloudLinux + Passenger) | Node **22** (أو 20.9 على الأقل؛ Next.js 16 يرفض ما دونه) |
| SSH | لتنفيذ `npm ci` و`npm run build` |
| ذاكرة LVE أثناء البناء | نحو 2GB (وإلا ابنِ على Linux خارجياً وارفع الناتج) |
| inodes | `node_modules` وحده ≈ 50,000 |
| HTTPS (AutoSSL) | ضروري للـ PWA والإشعارات |
| اتصال صادر 443 | إلى `*.supabase.co` و`api.ultramsg.com` وخوادم الإشعارات و`fonts.googleapis.com` (وقت البناء) |

## 2. إنشاء التطبيق في cPanel

1. **Setup Node.js App → Create Application**
   - Node.js version: 22
   - Application mode: **Production** (إلزامي: وضع Development يعطّل الـ Service Worker أثناء البناء)
   - Application root: مجلد مستقل **خارج `public_html`** مثل `aws-diamond`
   - Application URL: الدومين
   - Application startup file: `server.js`
2. **Environment variables**: أدخل كل الأسماء الموجودة في `.env.example` بقيمها الحقيقية.
3. أنشئ أيضاً ملف `.env.production` (صلاحيات 600) في جذر التطبيق بنفس القيم، لأن البناء عبر SSH يحتاجها
   (قيم `NEXT_PUBLIC_*` تُدمج وقت البناء، وبعض المسارات تقرأ الأسرار عند التحميل).
   **لا تضع `.env.local` على السيرفر** (له أولوية أعلى وقد يحمل قيماً محلية).

## 3. جلب الكود

الأفضل: **Git Version Control** في cPanel → استنساخ المستودع إلى جذر التطبيق. أو `git archive HEAD` ثم رفع الأرشيف.
لا ترفع أبداً: `node_modules` أو `.next` أو `.env*` أو ملفات المجلد الجذري التجريبية (سكربتات `*.mjs`/`*.js`/`*.sql`).

## 4. البناء (عبر SSH)

```bash
source /home/USER/nodevenv/aws-diamond/22/bin/activate   # المسار الفعلي يظهر أعلى شاشة Setup Node.js App
cd /home/USER/aws-diamond
node -v                                    # ≥ 20.9
ls .env.local 2>/dev/null && echo "احذف .env.local من السيرفر"
npm ci --include=dev                       # devDependencies لازمة للبناء حتى في وضع Production
NODE_ENV=production NEXT_BUILD_CPUS=1 npm run build
```

تحقق بعد البناء:

```bash
grep -q "Bundling the service worker" -r .next/trace 2>/dev/null; ls -la public/sw.js .next/BUILD_ID
grep -c "localhost:3000" .next/server/app/api/auth/register/route.js     # يجب أن يعطي 0
grep -rl __SERWIST_SW_ENTRY .next/static/chunks | head -1                  # يجب أن يطبع ملفاً
```

ثم **Restart** من واجهة cPanel (أو `touch tmp/restart.txt`). السجلات في `stderr.log` داخل جذر التطبيق.

> عند التحديثات اللاحقة: ابنِ في مجلد إصدار جديد ثم وجّه Application root إليه وأعد التشغيل،
> لأن `next build` يمسح `.next` ويعطّل الموقع طوال مدة البناء لو بُني في المجلد الحي.

## 5. بعد الإطلاق

- فعّل **Force HTTPS Redirect** وتحويل www ↔ apex إلى الأصل المستخدم في `NEXT_PUBLIC_SITE_URL`.
- إن تغيّر الدومين: Supabase → Authentication → URL Configuration → Site URL + Redirect URLs.
- اختبارات سريعة: تسجيل دخول بجوجل يعود إلى الدومين (لا إلى localhost)، نسيت كلمة المرور، فتح
  `/certificates`، إرسال إشعار من الإدارة، `curl -sI https://DOMAIN/sw.js` → 200.
- (اختياري) Cron كل 5 دقائق لإبقاء التطبيق دافئاً: `curl -s -o /dev/null https://DOMAIN/favicon.ico`
- مسارات `/api/cron/*` غير مجدولة حالياً عمداً؛ تُجدول لاحقاً بعد تفعيل واجهة تقارير أولياء الأمور.

## 6. الرجوع

أعد سجل DNS إلى Vercel (اجعل TTL منخفضاً قبل النقل). لا شيء يتغير في Supabase.
