# نشر المنصة على استضافة cPanel (Node.js / Passenger)

هذا الدليل يخص الاستضافة الذاتية على cPanel. قاعدة البيانات والمصادقة والتخزين تبقى على Supabase بلا أي تغيير.
الكود يعمل أيضاً على Vercel كما هو؛ `server.js` يُستخدم على cPanel فقط.

هناك طريقتان:
- **الطريقة أ (الموصى بها): حزمة مبنية مسبقاً** تُبنى على جهاز المطوّر وتُرفع جاهزة؛ لا `npm` ولا `next build` على السيرفر.
- **الطريقة ب: البناء على السيرفر** عبر SSH (تحتاج Node 22 وذاكرة نحو 2GB أثناء البناء).

## الطريقة أ — الحزمة المبنية مسبقاً

### إنتاج الحزمة (على جهاز المطوّر)

```bash
# 1) .env.production في جذر المشروع بقيم الإنتاج (Supabase + VAPID + CRON_SECRET). اترك NEXT_PUBLIC_SITE_URL فارغاً:
#    الدومين يُضبط وقت التشغيل عبر SITE_URL ولا يُدمج في الحزمة. انقل .env.local مؤقتاً خارج المجلد:
#    next build يقرؤه حتى مع NODE_ENV=production وهو يتقدم على .env.production (فيُدمج عنوان Vercel).
NEXT_OUTPUT_STANDALONE=1 NODE_ENV=production npm run build   # ينتج .next/standalone
node scripts/package-cpanel.mjs                                # يجمّع dist-cpanel/ (الخادم + node_modules اللازمة + public + .next/static)
# 2) ضع .env.production (بقيم الإنتاج وSITE_URL=https://الدومين) داخل dist-cpanel/ ثم اضغط محتوى المجلد (لا المجلد نفسه) في zip.
```

ما بداخل الحزمة: `server.js` (غلاف Passenger يحمّل `.env.production` ثم يشغّل خادم Next)، `next-standalone.js` (خادم Next المولَّد)،
`.next/` (ناتج البناء)، `node_modules/` (حزم التشغيل فقط، نحو ربع الحجم الكامل)، `public/` (مع `sw.js` المبني)، `package.json`، `BUILD_INFO.txt`.
لا تحتاج `next.config.ts` ولا الشيفرة المصدرية على السيرفر.

### التثبيت على cPanel

1. **File Manager** → في `/home/USER` (خارج `public_html`) أنشئ مجلد التطبيق (مثل `aws-diamond`) → Upload → الـ zip → Extract في المجلد نفسه → احذف الـ zip. يجب أن يكون `server.js` و`next-standalone.js` و`.next` و`node_modules` و`public` و`.env.production` في جذر المجلد مباشرة. افعل هذا **قبل** إنشاء التطبيق: إنشاؤه على مجلد فارغ يكتب `server.js` تجريبياً (نافذة Extract لا تعرض خيار استبدال).
2. حرّر `.env.production` (فعّل Show Hidden Files؛ في نافذة الترميز أبقِ utf-8) وضع الدومين في `SITE_URL`، وصلاحيات الملف 600. لا حاجة لإدخال المتغيرات في واجهة cPanel؛ إن أدخلتها فلها الأولوية على الملف (ويُقبل الاسم `NEXT_PUBLIC_SITE_URL` بديلاً عن `SITE_URL`).
3. **Setup Node.js App → Create Application**: Node **22** (أو 20.19+)، Application mode **Production**، Application root = المجلد أعلاه، Application URL = الدومين من القائمة مع ترك حقل المسار الذي يليه **فارغاً**، startup file `server.js`. لا تضغط Run NPM Install.
4. **Restart** من صفحة التطبيق. السجلات في `stderr.log` داخل جذر التطبيق.
5. حوّل DNS إلى السيرفر، شغّل AutoSSL، ثم أكمل خطوات القسم 5 (بعد الإطلاق) أدناه. لا تحوّل DNS قبل الخطوات 1-4 (الموقع يبقى على Vercel أثناءها).

عند التحديث: لا تغيّر حقل Application root. ارفع الحزمة الجديدة في مجلد مجاور (مثل `aws-diamond-v2`) وانسخ إليه `.env.production`، ثم أعد تسمية `aws-diamond` إلى `aws-diamond-old` و`aws-diamond-v2` إلى `aws-diamond` واضغط Restart؛ الرجوع = عكس التسميتين. (CloudLinux لا يوثّق ما يحدث عند تغيير Application root إلى مجلد موجود، وإعادة التسمية تُبقي المسار الذي يشير إليه `.htaccess` وسجل Passenger.)

ملاحظة Passenger: لا يُفتح أي منفذ TCP (listen يُعترض) ولا يستطيع Next استدعاء نفسه داخلياً (تمرير Server Action إلى صفحة أخرى أو بثّ redirect من داخل Action)؛ الأثر الوحيد خطأ "unexpected response" لإجراء أُطلق بعد انتهاء الجلسة، وهو نفس ما يحدث على Vercel. `server.js` يضبط PORT=39999 تحت Passenger حتى يفشل هذا الاستدعاء فوراً بدل الوصول إلى منفذ 3000 لتطبيق جار على الاستضافة المشتركة. بعد النشر راجع `stderr.log` بحثاً عن "failed to forward action response".

ملاحظة الانتقال بين الأنظمة: الحزمة تُبنى على Windows وتعمل على Linux لأن ناتج Next نقي JavaScript (لا وحدات أصلية: `images.unoptimized` يلغي sharp، ولا يُستخدم SWC وقت التشغيل).

## الطريقة ب — البناء على السيرفر

## 1. متطلبات الاستضافة (تأكد منها قبل البدء)

| المتطلب | الحد الأدنى |
|---------|-------------|
| Setup Node.js App (CloudLinux + Passenger) | Node **22** (22.12 أو أحدث). إن لم يتوفر إلا 20 فيجب أن يكون **20.19 أو أحدث**: Next.js 16 يشترط 20.9، لكن `@serwist/next` حزمة ESM تُحمَّل عبر `require` عند قراءة `next.config.ts`، وهذا يحتاج 20.19+/22.12+ وإلا فشل البناء والتشغيل بخطأ ERR_REQUIRE_ESM |
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
   - Application URL: الدومين من القائمة، مع ترك حقل المسار الذي يليه فارغاً
   - Application startup file: `server.js`
2. **Environment variables**: أدخل كل الأسماء الموجودة في `.env.example` بقيمها الحقيقية. لا تُنشئ أبداً متغيراً سرياً باسم يبدأ بـ `NEXT_PUBLIC_` (يُدمج في كود المتصفح).
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
node -v                                    # 22.12+ (أو 20.19+)
ls .env.local 2>/dev/null && echo "احذف .env.local من السيرفر"
npm ci --include=dev                       # devDependencies لازمة للبناء حتى في وضع Production
NODE_ENV=production NEXT_BUILD_CPUS=1 npm run build 2>&1 | tee build.log
grep -c "Bundling the service worker" build.log   # يجب أن يعطي 1 (Serwist لم يُعطَّل)
```

تحقق بعد البناء:

```bash
test -f public/sw.js && grep -c -F -e "$(cat .next/BUILD_ID)" public/sw.js   # يجب أن يعطي ≥ 1 (sw.js من نفس البناء)
grep -c "localhost:3000" .next/server/app/api/auth/check-email/route.js  # يجب أن يعطي 0
grep -rl "serviceWorker.register" .next/static/chunks | head -1              # يجب أن يطبع ملفاً (كود تسجيل الـ SW موجود)
```

ثم **Restart** من واجهة cPanel (أو `mkdir -p tmp && touch tmp/restart.txt`). السجلات في `stderr.log` داخل جذر التطبيق.

> عند التحديثات اللاحقة: انسخ الكود و`.env.production` إلى مجلد إصدار مجاور، نفّذ فيه `npm ci --include=dev` والبناء (تفعيل
> `nodevenv/aws-diamond/22` الحالي يكفي)، ثم بدّل المجلدين بإعادة التسمية (لا تغيّر Application root) وأعد التشغيل،
> لأن `next build` يمسح `.next` ويعطّل الموقع طوال مدة البناء لو بُني في المجلد الحي.
>
> ملاحظة: كاش أسئلة الاختبار النهائي يُبطَل داخل عملية Node التي استقبلت تعديل الأدمن فقط. التطبيق يعمل بعملية واحدة
> افتراضياً في Passenger؛ إن شغّل المزوّد أكثر من عملية فقد يظهر تعديل الأسئلة متأخراً، وإعادة التشغيل من cPanel هي الحل اليدوي.

## 5. بعد الإطلاق

- فعّل **Force HTTPS Redirect** وتحويل www ↔ apex إلى الأصل المستخدم في `SITE_URL` (أو `NEXT_PUBLIC_SITE_URL` عند البناء على السيرفر).
- إن تغيّر الدومين: Supabase → Authentication → URL Configuration → Site URL + Redirect URLs بالصيغتين `https://DOMAIN/**` و`https://www.DOMAIN/**` (صفحة الدخول ترسل أصل المتصفح كما فُتح).
- اختبارات سريعة: تسجيل دخول بجوجل يعود إلى الدومين (لا إلى localhost)، نسيت كلمة المرور، فتح
  `/certificates`، إرسال إشعار من الإدارة، `curl -sI https://DOMAIN/sw.js` → 200.
- (اختياري) Cron كل 5 دقائق لإبقاء التطبيق دافئاً: `curl -s -o /dev/null https://DOMAIN/favicon.ico`
- مسارات `/api/cron/*` غير مجدولة حالياً عمداً؛ تُجدول لاحقاً بعد تفعيل واجهة تقارير أولياء الأمور.

## 6. الرجوع

أعد سجل DNS إلى Vercel (اجعل TTL منخفضاً قبل النقل). لا شيء يتغير في Supabase.
