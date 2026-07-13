"use client";

import React, { useRef } from "react";
import { IconSchool, IconDownload, IconShare } from "@tabler/icons-react";
import { Certificate } from "@/lib/supabase/services/certificates";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import Link from "next/link";

export default function CertificateClient({ cert }: { cert: Certificate }) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    try {
      // Temporarily intercept window errors to prevent Next.js overlay for CSS styling issues
      const errorHandler = (e: ErrorEvent) => {
        if (e.message && e.message.includes('cssRules')) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      window.addEventListener('error', errorHandler, true);

      const filter = (node: HTMLElement) => {
        if (node.tagName === 'LINK') return false;
        return true;
      };

      const dataUrl = await toPng(certificateRef.current, { 
        quality: 1, 
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        filter
      });
      
      window.removeEventListener('error', errorHandler, true);

      const link = document.createElement('a');
      link.download = `certificate-${cert.student_name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating image:", err);
    }
  };

  const handleDownloadPdf = async () => {
    if (!certificateRef.current) return;
    try {
      const errorHandler = (e: ErrorEvent) => {
        if (e.message && e.message.includes('cssRules')) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      window.addEventListener('error', errorHandler, true);

      const filter = (node: HTMLElement) => {
        if (node.tagName === 'LINK') return false;
        return true;
      };

      const dataUrl = await toPng(certificateRef.current, { 
        quality: 1, 
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        filter
      });
      
      window.removeEventListener('error', errorHandler, true);

      // Create PDF: A4 landscape (297x210 mm)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Calculate image dimensions to fit A4 page
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`certificate-${cert.student_name}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;
      if (navigator.share) {
        await navigator.share({
          title: 'شهادة إتمام محاكي الأوس الماسية',
          text: `شاهد شهادة اجتيازي لمحاكي اختبار ${cert.course_title} بنجاح على منصة الأوس الماسية!`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("تم نسخ رابط الشهادة بنجاح للمشاركة!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const issuedDate = new Date(cert.issued_at).toLocaleDateString('en-GB');

  const getEstimationMessage = (pct: number, examTitle: string) => {
    const TitleSpan = () => <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded mx-1 whitespace-nowrap">"{examTitle}"</span>;
    if (pct >= 85) return <>قد اجتاز بنجاح وتفوق <TitleSpan /> وحصل على درجة (ممتاز)، مما يعكس استعداده التام لاجتياز الاختبار الحقيقي بثقة عالية.</>;
    if (pct >= 75) return <>قد اجتاز بنجاح <TitleSpan /> وحصل على درجة (جيد جداً)، مما يعكس مستوى متقدماً وجاهزية ممتازة للاختبار الحقيقي.</>;
    if (pct >= 65) return <>قد اجتاز بنجاح <TitleSpan /> وحصل على درجة (جيد)، مما يعكس تحضيراً مناسباً للاختبار الحقيقي.</>;
    return <>قد اجتاز <TitleSpan /> وحصل على درجة (مقبول)، مما يعكس إلماماً بالأساسيات، مع أمنياتنا له بمزيد من التوفيق.</>;
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Certificate Container */}
      <div className="w-full relative mb-8 group max-w-4xl">
        <div 
          ref={certificateRef}
          className="w-full min-h-[500px] md:min-h-[600px] bg-white rounded-xl text-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between p-8 md:p-12"
          dir="rtl"
        >
          {/* Outer and Inner Borders */}
          <div className="absolute inset-0 border-[6px] md:border-[10px] border-orange-500 m-2 md:m-3 opacity-100 pointer-events-none"></div>
          <div className="absolute inset-0 border-[1px] md:border-[2px] border-orange-300 m-[12px] md:m-[18px] opacity-60 pointer-events-none"></div>
          
          {/* Security Paper Background Pattern */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ea580c 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          
          <div className="flex flex-col items-center justify-center text-center z-10 relative flex-1 w-full max-w-[90%] mx-auto mt-4 md:mt-8">
            
            {/* Header Badge (Logo) */}
            <div className="mb-4 md:mb-6 relative">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20 border-[3px] border-white mx-auto relative z-10">
                <IconSchool className="text-white w-8 h-8 md:w-10 md:h-10" stroke={2} />
              </div>
              {/* Ribbon Tails */}
              <div className="absolute -bottom-2 left-2 md:left-4 w-4 md:w-5 h-6 md:h-8 bg-orange-800 -rotate-12 rounded-sm z-0 shadow-sm"></div>
              <div className="absolute -bottom-2 right-2 md:right-4 w-4 md:w-5 h-6 md:h-8 bg-orange-800 rotate-12 rounded-sm z-0 shadow-sm"></div>
            </div>

            <h3 className="text-orange-600 font-bold tracking-widest uppercase text-xs md:text-sm mb-2">منصة الأوس الماسية للتدريب</h3>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 drop-shadow-sm">شهادة إتمام اختبار</h1>
            
            <p className="text-slate-500 font-semibold text-sm md:text-base mb-2">تشهد إدارة المنصة بأن المتدرب:</p>
            
            {/* User Name */}
            <div className="text-4xl md:text-6xl font-black mb-6 md:mb-8 text-transparent bg-clip-text bg-gradient-to-r from-orange-700 via-orange-500 to-orange-700 leading-tight w-full break-words">
              {cert.student_name || 'متدرب في الأوس الماسية'}
            </div>

            {/* Description text */}
            <p className="text-slate-600 text-sm md:text-lg leading-relaxed font-bold w-full max-w-2xl mb-8 md:mb-12">
              {getEstimationMessage(cert.score_pct, cert.course_title || 'محاكي اختبار ستيب')}
            </p>

            {/* Bottom Signature & Score Block */}
            <div className="flex items-end justify-between w-full mt-auto pt-4 md:pt-8 px-2 md:px-8">
              <div className="text-center w-24 md:w-32">
                <div className="border-b-2 border-slate-300 mb-2 w-full"></div>
                <div className="text-slate-500 text-[10px] md:text-xs font-bold uppercase">إدارة المنصة</div>
              </div>
              
              <div className="text-center flex flex-col items-center px-4">
                <div className="text-slate-500 text-[10px] md:text-xs font-bold mb-1 uppercase tracking-wider">الدرجة النهائية</div>
                <div className="text-4xl md:text-6xl font-black text-orange-600 leading-none">{cert.score_pct}%</div>
              </div>

              <div className="text-center w-24 md:w-32">
                <div className="text-slate-800 text-xs md:text-sm font-bold mb-1">{issuedDate}</div>
                <div className="border-b-2 border-slate-300 mb-2 w-full"></div>
                <div className="text-slate-500 text-[10px] md:text-xs font-bold uppercase">تاريخ الإصدار</div>
              </div>
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="w-full text-center z-10 mt-8 md:mt-12 mb-2 md:mb-4 px-4 md:px-8">
            <p className="text-[8px] md:text-[10px] text-slate-400 font-medium leading-tight text-center">
              * تنويه: هذه الشهادة هي توثيق لاجتياز اختبار محاكي للتدريب على منصة الأوس الماسية فقط. ولا تمثل أو تغني عن الاختبار الحقيقي الرسمي، ولا يترتب عليها أي التزام أو مسؤولية قانونية أو أكاديمية.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mt-8 w-full max-w-lg mx-auto justify-center">
        <button 
          onClick={handleDownloadPdf}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-md hover:-translate-y-0.5"
        >
          <IconDownload size={20} />
          تحميل كـ PDF
        </button>
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:-translate-y-0.5"
        >
          <IconDownload size={20} />
          تحميل كصورة
        </button>
        <button 
          onClick={handleShare}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm hover:-translate-y-0.5"
        >
          <IconShare size={20} />
          مشاركة الرابط
        </button>
      </div>
    </div>
  );
}
