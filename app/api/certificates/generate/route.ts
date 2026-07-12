import { NextRequest, NextResponse } from "next/server";
import { fetchCertificateById } from "@/lib/supabase/services/certificates";

// This route generates a professional PDF certificate using Puppeteer
// GET /api/certificates/generate?id=<cert-id>
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing certificate ID" }, { status: 400 });

  const cert = await fetchCertificateById(id);
  if (!cert) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });

  const issuedDate = new Date(cert.issued_at).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const verifyUrl = `${req.nextUrl.origin}/verify/${cert.id}`;

  const html = buildCertificateHTML({
    studentName: cert.student_name,
    courseTitle: cert.course_title,
    scorePct: cert.score_pct,
    issuedDate,
    certId: cert.id,
    verifyUrl,
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

// ─── Certificate HTML Template ────────────────────────────────────────────────

function buildCertificateHTML(opts: {
  studentName: string;
  courseTitle: string;
  scorePct: number;
  issuedDate: string;
  certId: string;
  verifyUrl: string;
}) {
  const { studentName, courseTitle, scorePct, issuedDate, certId, verifyUrl } = opts;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@400;500;700;800;900&display=swap');
    
    @page { size: A4 landscape; margin: 0; }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    html, body {
      width: 1122px;
      height: 794px;
      overflow: hidden;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    
    .cert-container {
      width: 1122px;
      height: 794px;
      position: relative;
      background-color: #fdfbf7;
      background-image: radial-gradient(#ebe6df 1px, transparent 1px);
      background-size: 20px 20px;
      padding: 40px;
      display: flex;
    }
    
    /* Outer elegant border */
    .cert-border {
      flex: 1;
      position: relative;
      border: 2px solid #C5A059;
      background: #ffffff;
      padding: 12px;
      box-shadow: inset 0 0 40px rgba(197, 160, 89, 0.1), 0 10px 30px rgba(0,0,0,0.1);
    }
    
    /* Inner dark border */
    .cert-inner {
      width: 100%;
      height: 100%;
      border: 3px solid #1A2B4C;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 60px;
    }
    
    /* Corner ornaments */
    .ornament {
      position: absolute;
      width: 60px; height: 60px;
      border: 4px solid transparent;
    }
    .ornament.tl { top: -4px; right: -4px; border-top-color: #C5A059; border-right-color: #C5A059; border-radius: 0 16px 0 0; }
    .ornament.tr { top: -4px; left: -4px; border-top-color: #C5A059; border-left-color: #C5A059; border-radius: 16px 0 0 0; }
    .ornament.bl { bottom: -4px; right: -4px; border-bottom-color: #C5A059; border-right-color: #C5A059; border-radius: 0 0 16px 0; }
    .ornament.br { bottom: -4px; left: -4px; border-bottom-color: #C5A059; border-left-color: #C5A059; border-radius: 0 0 0 16px; }

    /* Header */
    .header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 20px;
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 15px;
    }
    .logo-icon {
      width: 60px; height: 60px;
      background: #1A2B4C;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      color: #C5A059;
      box-shadow: 0 4px 15px rgba(26, 43, 76, 0.2);
      border: 2px solid #C5A059;
    }
    .platform-name {
      font-family: 'Tajawal', sans-serif;
      font-size: 26px;
      font-weight: 900;
      color: #1A2B4C;
      letter-spacing: 1px;
    }
    
    .cert-subtitle {
      font-family: 'Tajawal', sans-serif;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 8px;
      text-transform: uppercase;
      color: #C5A059;
      margin-bottom: 25px;
    }
    
    .cert-title {
      font-family: 'Amiri', serif;
      font-size: 54px;
      font-weight: 700;
      color: #1A2B4C;
      margin-bottom: 30px;
      text-align: center;
      line-height: 1.6;
    }
    
    /* Body */
    .body-content {
      text-align: center;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .presented-text {
      font-family: 'Tajawal', sans-serif;
      font-size: 18px;
      color: #555;
      margin-bottom: 15px;
    }
    .student-name {
      font-family: 'Amiri', serif;
      font-size: 52px;
      font-weight: 700;
      color: #C5A059;
      margin-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 10px;
      min-width: 500px;
      display: inline-block;
    }
    .reason-text {
      font-family: 'Tajawal', sans-serif;
      font-size: 18px;
      color: #555;
      margin-top: 15px;
      margin-bottom: 10px;
    }
    .course-name {
      font-family: 'Tajawal', sans-serif;
      font-size: 32px;
      font-weight: 900;
      color: #1A2B4C;
      margin-bottom: 20px;
      max-width: 800px;
      line-height: 1.4;
    }
    
    .score-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 50px;
      padding: 10px 30px;
      font-family: 'Tajawal', sans-serif;
      font-size: 18px;
      font-weight: 800;
      color: #1A2B4C;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .score-badge span {
      color: #C5A059;
    }
    
    /* Footer */
    .footer {
      position: absolute;
      bottom: 60px;
      left: 60px;
      right: 60px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    
    .signature-block {
      text-align: center;
      width: 200px;
    }
    .signature-line {
      width: 100%;
      height: 1px;
      background: #1A2B4C;
      margin-bottom: 8px;
    }
    .signature-text {
      font-family: 'Tajawal', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: #1A2B4C;
    }
    
    .seal-container {
      position: absolute;
      top: 60%;
      left: 70px;
      transform: translateY(-50%);
      width: 130px;
      height: 130px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #1A2B4C;
      border: 4px solid #C5A059;
      box-shadow: 0 10px 25px rgba(26, 43, 76, 0.3);
      z-index: 10;
    }
    .seal-text {
      font-family: 'Tajawal', sans-serif;
      color: #C5A059;
      font-size: 15px;
      font-weight: 900;
      text-align: center;
      line-height: 1.4;
    }
    
    .qr-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      width: 200px;
    }
    .qr-img {
      width: 90px;
      height: 90px;
      padding: 6px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    .qr-text {
      font-family: 'Tajawal', sans-serif;
      font-size: 11px;
      color: #64748b;
      font-weight: 700;
      text-align: center;
    }
    
    .cert-meta {
      position: absolute;
      bottom: 15px;
      left: 0;
      right: 0;
      text-align: center;
      font-family: 'Tajawal', sans-serif;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="cert-container">
    <div class="cert-border">
      <div class="cert-inner">
        <div class="ornament tl"></div>
        <div class="ornament tr"></div>
        <div class="ornament bl"></div>
        <div class="ornament br"></div>
        
        <div class="header">
          <div class="logo-container">
            <div class="logo-icon">🎓</div>
            <div class="platform-name">منصة الأوس الماسية</div>
          </div>
          <div class="cert-subtitle">Certificate of Completion</div>
          <div class="cert-title">شَهَادَة إتْمَام دَوْرَة</div>
        </div>
        
        <div class="body-content">
          <div class="presented-text">يُشهد بأن الطالب / الطالبة</div>
          <div class="student-name">${studentName}</div>
          <div class="reason-text">قد أتم/ت بنجاح متطلبات اجتياز الدورة التدريبية</div>
          <div class="course-name">${courseTitle}</div>
          
          <div class="score-badge">
            التقييم النهائي: <span>${scorePct}%</span>
          </div>
        </div>
        
        <div class="seal-container">
          <div class="seal-text">معتمد<br>رسمياً<br>★</div>
        </div>
        
        <div class="footer">
          <div class="qr-block">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(verifyUrl)}" class="qr-img" alt="QR Code" />
            <div class="qr-text">امسح الكود<br>للتحقق من الشهادة</div>
          </div>
          
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-text">مدير المنصة</div>
            <div class="signature-text" style="font-weight: 400; font-size: 12px; margin-top: 5px;">تاريخ الإصدار: ${issuedDate}</div>
          </div>
        </div>
        
        <div class="cert-meta">
          رقم الاعتماد: ${certId.slice(0, 16).toUpperCase()}
        </div>
        
      </div>
    </div>
  </div>
  
  <!-- Client-side PDF Generation -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <script>
    window.onload = function() {
      // Create a loading overlay
      var overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
      overlay.style.zIndex = '9999';
      overlay.style.display = 'flex';
      overlay.style.flexDirection = 'column';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.fontFamily = "'Tajawal', sans-serif";
      
      var spinner = document.createElement('div');
      spinner.style.border = '4px solid #f3f3f3';
      spinner.style.borderTop = '4px solid #C5A059';
      spinner.style.borderRadius = '50%';
      spinner.style.width = '50px';
      spinner.style.height = '50px';
      spinner.style.animation = 'spin 1s linear infinite';
      
      var style = document.createElement('style');
      style.innerHTML = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
      document.head.appendChild(style);
      
      var text = document.createElement('h2');
      text.innerText = 'جاري تجهيز وتحميل الشهادة...';
      text.style.marginTop = '20px';
      text.style.color = '#1A2B4C';
      
      var subText = document.createElement('p');
      subText.innerText = 'يرجى الانتظار للحظات';
      subText.style.color = '#64748b';
      subText.style.marginTop = '10px';

      overlay.appendChild(spinner);
      overlay.appendChild(text);
      overlay.appendChild(subText);
      document.body.appendChild(overlay);

      // Generate PDF
      var element = document.querySelector('.cert-container');
      var opt = {
        margin:       0,
        filename:     'certificate-${certId.slice(0, 8)}.pdf',
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 3, useCORS: true, logging: false },
        jsPDF:        { unit: 'px', format: [1122, 794], orientation: 'landscape', hotfixes: ["px_scaling"] }
      };
      
      html2pdf().set(opt).from(element).save().then(function() {
        // Remove overlay and show success
        overlay.innerHTML = '<div style="font-size: 60px; margin-bottom: 20px;">✅</div><h2 style="color: #1A2B4C;">تم تحميل الشهادة بنجاح!</h2><p style="color: #64748b; margin-top: 10px;">يمكنك الآن إغلاق هذه النافذة أو الاحتفاظ بها كذكرى</p>';
      }).catch(function(err) {
        overlay.innerHTML = '<div style="font-size: 60px; margin-bottom: 20px;">❌</div><h2 style="color: #ef4444;">حدث خطأ أثناء التحميل</h2><p style="color: #64748b; margin-top: 10px;">يرجى تحديث الصفحة والمحاولة مرة أخرى</p>';
      });
    };
  </script>
</body>
</html>`;
}
