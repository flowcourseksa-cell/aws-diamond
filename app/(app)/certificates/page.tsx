// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { fetchStudentCertificates, type Certificate } from "@/lib/supabase/services/certificates";
import { IconDownload, IconShare, IconArrowRight, IconTrophy } from "@tabler/icons-react";

export default function CertificatesPage() {
  const router = useRouter();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const data = await fetchStudentCertificates(session.user.id);
      setCerts(data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text font-sans pb-24" dir="rtl">
      {/* Custom nav removed to prevent overlap with global AppShell Header & Sidebar */}

      <div className="max-w-5xl mx-auto px-4 pt-8 pb-16">
        <h1 className="text-2xl font-black text-text mb-8">شهاداتي</h1>
        {certs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24 gap-4">
            <div className="text-7xl">🎓</div>
            <h2 className="text-2xl font-black text-text">لا توجد شهادات بعد</h2>
            <p className="text-text-muted font-semibold max-w-sm">
              أكمل دوراتك واجتز الاختبار النهائي لكل دورة للحصول على شهادتك!
            </p>
            <Link href="/dashboard" className="mt-4 px-6 py-3 bg-primary text-white font-bold rounded-xl">
              ابدأ التعلم الآن
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-accent-amber/10 text-accent-amber flex items-center justify-center">
                <IconTrophy size={26} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-text">شهاداتي</h2>
                <p className="text-text-muted font-semibold">{certs.length} شهادة مكتسبة</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {certs.map((cert) => (
                <CertificateCard key={cert.id} cert={cert} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CertificateCard({ cert }: { cert: Certificate }) {
  const issuedDate = new Date(cert.issued_at).toLocaleDateString("ar-SA", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 p-6 text-white shadow-xl group">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg">
            🏆
          </div>
          <div className="text-right">
            <div className="text-xs font-bold uppercase tracking-widest opacity-50">درجة الاجتياز</div>
            <div className="text-3xl font-black text-amber-400">{cert.score_pct}%</div>
          </div>
        </div>

        <div className="mb-1 text-xs font-bold uppercase tracking-widest opacity-50">شهادة إتمام</div>
        <h3 className="text-xl font-black mb-1 leading-snug">{cert.course_title}</h3>
        <p className="text-sm opacity-60 font-semibold mb-6">{issuedDate}</p>

        <div className="h-px bg-white/10 mb-4" />

        <div className="flex gap-3">
          <a
            href={`/api/certificates/generate?id=${cert.id}`}
            target="_blank"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-l from-amber-500 to-yellow-400 text-white font-bold text-sm hover:shadow-lg hover:shadow-amber-500/20 transition-all"
          >
            <IconDownload size={16} /> تحميل PDF
          </a>
          <button
            onClick={() => {
              const url = `${window.location.origin}/verify/${cert.id}`;
              navigator.clipboard.writeText(url);
              alert("تم نسخ رابط الشهادة بنجاح! يمكنك الآن لصقه ومشاركته.");
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 border border-white/20 font-bold text-sm hover:bg-white/15 transition-colors"
          >
            <IconShare size={16} /> مشاركة
          </button>
        </div>
      </div>
    </div>
  );
}
