// @ts-nocheck
import { fetchCertificateById } from "@/lib/supabase/services/certificates";
import { notFound } from "next/navigation";
import { IconDownload, IconShare, IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import VerifyClientButtons from "./verify-client-buttons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const cert = await fetchCertificateById(resolvedParams.id);
  if (!cert) return { title: "شهادة غير موجودة" };
  return {
    title: `شهادة ${cert.student_name} — ${cert.course_title}`,
    description: `تحقق من صحة شهادة إتمام دورة "${cert.course_title}" الممنوحة لـ ${cert.student_name}`,
  };
}

export default async function VerifyCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const cert = await fetchCertificateById(resolvedParams.id);
  if (!cert) notFound();

  const issuedDate = new Date(cert.issued_at).toLocaleDateString("ar-SA", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div style={{ margin: 0, fontFamily: "'Tajawal', sans-serif", background: "#fdfdfc", minHeight: "100vh" }}>
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "linear-gradient(135deg, #fdfdfc 0%, #f3f4f6 100%)",
        color: "#1A2B4C",
      }}>
        {/* Badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          background: "#ecfdf5",
          border: "1px solid #10b981",
          borderRadius: 100, padding: "10px 24px", marginBottom: 32,
          fontSize: 16, fontWeight: 800, color: "#059669",
          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
        }}>
          ✅ شهادة مُتحقَّق منها رسمياً
        </div>

        {/* Certificate card */}
        <div style={{
          background: "#ffffff",
          border: "2px solid #C5A059",
          position: "relative",
          borderRadius: 24, padding: "48px 40px",
          maxWidth: 560, width: "100%",
          textAlign: "center",
          boxShadow: "0 25px 80px rgba(197, 160, 89, 0.15)",
        }}>
          {/* Inner border line */}
          <div style={{
            position: "absolute", top: 12, bottom: 12, left: 12, right: 12,
            border: "1px dashed #C5A059", borderRadius: 12, pointerEvents: "none"
          }} />

          <div style={{
            width: 70, height: 70, background: "#1A2B4C",
            color: "#C5A059", fontSize: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "50%", margin: "0 auto 20px",
            border: "3px solid #C5A059",
            position: "relative", zIndex: 2
          }}>
            🎓
          </div>
          
          <div style={{ position: "relative", zIndex: 2, fontSize: 13, fontWeight: 800, letterSpacing: 4, color: "#C5A059", marginBottom: 8 }}>
            شهادة إتمام دورة
          </div>

          <div style={{ position: "relative", zIndex: 2, fontSize: 40, fontFamily: "'Amiri', serif", fontWeight: 700, color: "#1A2B4C", marginBottom: 8 }}>
            {cert.student_name}
          </div>
          
          <div style={{ position: "relative", zIndex: 2, color: "#64748b", fontWeight: 700, fontSize: 15, marginBottom: 24 }}>
            أتم/ت بنجاح اجتياز الدورة التدريبية
          </div>

          <div style={{
            position: "relative", zIndex: 2,
            fontSize: 26, fontWeight: 900,
            color: "#1A2B4C",
            marginBottom: 32,
          }}>
            {cert.course_title}
          </div>

          <div style={{
            position: "relative", zIndex: 2,
            display: "flex", justifyContent: "center", gap: 32,
            borderTop: "1px solid #e2e8f0",
            paddingTop: 24,
          }}>
            {[
              { label: "التقييم النهائي", value: `${cert.score_pct}%` },
              { label: "تاريخ الإصدار", value: issuedDate },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{label}</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1A2B4C" }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{
            position: "relative", zIndex: 2,
            marginTop: 32, fontSize: 11, color: "#94a3b8",
            fontFamily: "monospace", letterSpacing: 1,
          }}>
            رقم الشهادة: {cert.id.toUpperCase()}
          </div>
        </div>

        {/* Platform badge */}
        <div style={{ marginTop: 32, color: "#64748b", fontSize: 14, fontWeight: 700, marginBottom: 40 }}>
          منصة الأوس الماسية · التعليم بلا حدود
        </div>

        {/* Action Buttons */}
        <VerifyClientButtons certId={cert.id} />
        
        <div style={{ marginTop: 32 }}>
          <Link 
            href="/"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              padding: "16px 40px", backgroundColor: "#1A2B4C", color: "white",
              fontSize: "18px", fontWeight: "bold", borderRadius: "16px",
              textDecoration: "none", boxShadow: "0 10px 25px rgba(26, 43, 76, 0.2)",
              border: "1px solid #0f172a"
            }}
          >
            الذهاب لمنصة الأوس الماسية
          </Link>
        </div>
      </div>
    </div>
  );
}
