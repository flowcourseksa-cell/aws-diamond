const fs = require('fs');

const dir = 'F:\\القوالب';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Tahoma, sans-serif; background: #f4f7f6; padding: 20px; }
        .page { background: white; padding: 40px; margin: 20px auto; max-width: 800px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); border-radius: 10px; page-break-after: always; }
        h1 { color: #2c3e50; text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #2980b9; }
        p { font-size: 18px; line-height: 1.6; color: #34495e; }
        .footer { text-align: center; margin-top: 50px; font-size: 14px; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 10px; }
        .highlight { background: #e8f4f8; padding: 15px; border-right: 4px solid #3498db; margin: 20px 0; }
        @media print { body { background: white; padding: 0; margin: 0; } .page { box-shadow: none; border-radius: 0; margin: 0 auto; padding: 20mm; } }
    </style>
</head>
<body>
    <!-- Page 1 -->
    <div class="page">
        <h1>منصة الأوس الماسية</h1>
        <h2>ملزمة التأسيس السريع - الجبر (كمي)</h2>
        <div class="highlight">
            <p><b>قاعدة 1:</b> عند ضرب الأساسات المتشابهة نجمع الأسس. (مثال: س² × س³ = س⁵)</p>
            <p><b>قاعدة 2:</b> عند قسمة الأساسات المتشابهة نطرح الأسس.</p>
            <p><b>قاعدة 3:</b> أي عدد (غير الصفر) أُس صفر يساوي 1.</p>
        </div>
        <h3>تدريب سريع:</h3>
        <p>إذا كان 5^س = 125، فما قيمة س؟<br><b>الجواب:</b> س = 3 (لأن 5×5×5 = 125).</p>
        <div class="footer">جميع الحقوق محفوظة لمنصة الأوس الماسية © 2024</div>
    </div>
    
    <!-- Page 2 -->
    <div class="page">
        <h1>منصة الأوس الماسية</h1>
        <h2>أهم تجميعات الهندسة 2024 (كمي)</h2>
        <div class="highlight">
            <p>1. مجموع زوايا المثلث الداخلية دائماً = 180 درجة.</p>
            <p>2. مساحة الدائرة = ط × نق².</p>
            <p>3. محيط المربع = طول الضلع × 4.</p>
        </div>
        <h3>سؤال هام يتكرر:</h3>
        <p>مثلث قائم الزاوية طول ضلعي القائمة فيه 3 و 4، فما طول الوتر؟<br><b>الجواب:</b> 5 (حسب نظرية فيثاغورس المشهورة 3، 4، 5).</p>
        <div class="footer">جميع الحقوق محفوظة لمنصة الأوس الماسية © 2024</div>
    </div>
    
    <!-- Page 3 -->
    <div class="page">
        <h1>منصة الأوس الماسية</h1>
        <h2>الخريطة الذهنية لاستيعاب المقروء (لفظي)</h2>
        <div class="highlight">
            <p><b>أهم تكتيكات الحل لاختصار الوقت:</b></p>
            <p>1. اقرأ السؤال أولاً قبل قراءة القطعة لتعرف عمّا تبحث.</p>
            <p>2. في أسئلة (القرن والعقد): أضف 1 لخانة المئات لتحصل على القرن. (مثال: سنة 1995 في القرن الـ 20).</p>
            <p>3. انتبه للكلمات المفتاحية في القطعة مثل: (بيد أن، على الرغم من، لاسيما) لأنها تغير مجرى المعنى وغالباً يكون فيها موضع السؤال.</p>
        </div>
        <div class="footer">جميع الحقوق محفوظة لمنصة الأوس الماسية © 2024</div>
    </div>
    
    <!-- Page 4 -->
    <div class="page">
        <h1>منصة الأوس الماسية</h1>
        <h2>ورقة عمل وتدريب - المفردة الشاذة (لفظي)</h2>
        <div class="highlight">
            <p><b>فكرة القسم:</b> إيجاد الكلمة التي لا ترتبط بباقي الكلمات بأي رابط منطقي.</p>
        </div>
        <h3>أمثلة تدريبية:</h3>
        <p><b>مثال 1:</b> (أسد - نمر - ذئب - بقرة)<br><b>الشاذ:</b> بقرة (لأنها من آكلات الأعشاب والبقية آكلات لحوم ومفترسة).</p>
        <p><b>مثال 2:</b> (نخلة - شجرة - وردة - تفاحة)<br><b>الشاذ:</b> تفاحة (لأنها ثمرة، والبقية نباتات كاملة).</p>
        <div class="footer">جميع الحقوق محفوظة لمنصة الأوس الماسية © 2024</div>
    </div>
</body>
</html>`;

fs.writeFileSync('F:\\القوالب\\مكتبة_الأوس_الماسية.html', html, 'utf8');
console.log('File successfully created at F:\\القوالب\\مكتبة_الأوس_الماسية.html');
