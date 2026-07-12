import { fetchCertificateById } from "@/lib/supabase/services/certificates";
import { IconAward, IconCheck, IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import CertificateClient from "./certificate-client";

export default async function CertificatePage(props: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await props.params;
  const cert = await fetchCertificateById(unwrappedParams.id);

  if (!cert) {
    return notFound();
  }

  if (cert.score_pct < 50) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-center" dir="rtl">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
          <h1 className="text-2xl font-black text-slate-800 mb-4">عذراً، الشهادة غير متاحة</h1>
          <p className="text-slate-600 mb-8 font-medium leading-relaxed">
            لا يمكن إصدار أو عرض شهادة لدرجة أقل من 50%. ننصحك بالتدرب أكثر وإعادة المحاولة للوصول إلى النسبة المطلوبة وأعلى!
          </p>
          <Link 
            href="/"
            className="inline-block w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans py-12" dir="rtl">
      <div className="max-w-2xl w-full flex flex-col items-center">
        
        {/* Top bar with back button */}
        <div className="w-full flex items-center justify-start mb-6">
          <Link 
            href={`/simulator/${cert.course_id}`} 
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 font-bold rounded-xl shadow-sm transition-all"
          >
            <IconArrowRight size={20} />
            رجوع
          </Link>
        </div>

        {/* Interactive Certificate Component */}
        <CertificateClient cert={cert} />

        {/* Call to Action for visitors */}
        <div className="mt-16 mb-8 text-center fade-in w-full">
          <Link 
            href={`/simulator/${cert.course_id}`}
            className="inline-flex w-full sm:w-auto items-center justify-center px-10 py-4 bg-slate-900 text-white text-lg font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 hover:-translate-y-1 border border-slate-700"
          >
            الذهاب لصفحة المحاكي
          </Link>
        </div>

      </div>
    </div>
  );
}
