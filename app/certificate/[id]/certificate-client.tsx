"use client";

import React, { useRef } from "react";
import { IconDownload, IconShare } from "@tabler/icons-react";
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

      // Calculate image dimensions
      const imgProps = pdf.getImageProperties(dataUrl);
      const isPortrait = imgProps.height > imgProps.width;

      // Create PDF: A4
      const pdfDoc = new jsPDF({
        orientation: isPortrait ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdfDoc.internal.pageSize.getWidth();
      const pdfHeight = pdfDoc.internal.pageSize.getHeight();
      
      // Scale to fit within A4 dimensions
      const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
      const scaledWidth = imgProps.width * ratio;
      const scaledHeight = imgProps.height * ratio;
      
      // Center the image on the page
      const x = (pdfWidth - scaledWidth) / 2;
      const y = (pdfHeight - scaledHeight) / 2;
      
      pdfDoc.addImage(dataUrl, 'PNG', x, y, scaledWidth, scaledHeight);
      pdfDoc.save(`certificate-${cert.student_name}.pdf`);
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


  return (
    <div className="w-full flex flex-col items-center">
      {/* Certificate Container */}
      <div className="w-full relative mb-8 group max-w-5xl overflow-x-auto pb-4">
        <div 
          ref={certificateRef}
          className="min-w-[800px] w-full aspect-[1.414/1] bg-[#fdfbf7] p-[3%]"
          style={{
            backgroundImage: 'radial-gradient(#ebe6df 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
          dir="rtl"
        >
          {/* Outer Gold Border */}
          <div className="w-full h-full border-2 border-[#C5A059] bg-white p-[1.5%] shadow-[inset_0_0_40px_rgba(197,160,89,0.1),_0_10px_30px_rgba(0,0,0,0.1)] flex">
            
            {/* Inner Dark Blue Border */}
            <div className="w-full h-full border-4 border-[#1A2B4C] relative flex flex-col items-center py-[5%] px-[8%]">
              
              {/* Corner Ornaments */}
              <div className="absolute -top-1 -right-1 w-12 h-12 border-4 border-transparent border-t-[#C5A059] border-r-[#C5A059] rounded-tr-xl"></div>
              <div className="absolute -top-1 -left-1 w-12 h-12 border-4 border-transparent border-t-[#C5A059] border-l-[#C5A059] rounded-tl-xl"></div>
              <div className="absolute -bottom-1 -right-1 w-12 h-12 border-4 border-transparent border-b-[#C5A059] border-r-[#C5A059] rounded-br-xl"></div>
              <div className="absolute -bottom-1 -left-1 w-12 h-12 border-4 border-transparent border-b-[#C5A059] border-l-[#C5A059] rounded-bl-xl"></div>
              
              {/* Header */}
              <div className="flex flex-col items-center mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-[#1A2B4C] rounded-xl flex items-center justify-center text-[#C5A059] text-3xl shadow-lg border-2 border-[#C5A059]">
                    🎓
                  </div>
                  <div className="font-sans font-black text-2xl text-[#1A2B4C]">منصة الأوس الماسية</div>
                </div>
                <div className="font-sans text-sm font-bold tracking-[8px] uppercase text-[#C5A059] mb-4">
                  Certificate of Completion
                </div>
                <div className="font-serif text-5xl font-bold text-[#1A2B4C] mb-6">
                  شَهَادَة إتْمَام دَوْرَة
                </div>
              </div>
              
              {/* Body */}
              <div className="text-center flex-1 flex flex-col items-center">
                <div className="font-sans text-lg text-slate-600 mb-2">يُشهد بأن الطالب / الطالبة</div>
                <div className="font-serif text-[2.8rem] font-bold text-[#C5A059] border-b-2 border-slate-200 pb-2 mb-4 px-12 min-w-[400px]">
                  {cert.student_name}
                </div>
                <div className="font-sans text-lg text-slate-600 mb-4 mt-2">قد أتم/ت بنجاح متطلبات اجتياز الدورة التدريبية</div>
                <div className="font-sans text-3xl font-black text-[#1A2B4C] mb-8 max-w-2xl leading-relaxed">
                  {cert.course_title}
                </div>
                
                <div className="inline-flex items-center gap-3 bg-slate-50 border border-slate-300 rounded-full px-8 py-3 shadow-sm font-sans text-lg font-black text-[#1A2B4C]">
                  التقييم النهائي: <span className="text-[#C5A059]">{cert.score_pct}%</span>
                </div>
              </div>
              
              {/* Seal */}
              <div className="absolute top-[60%] -translate-y-1/2 left-[8%] w-32 h-32 rounded-full bg-[#1A2B4C] border-[4px] border-[#C5A059] shadow-xl z-10 flex items-center justify-center">
                <div className="font-sans text-[#C5A059] text-base font-black text-center leading-snug">
                  معتمد<br/>رسمياً<br/>★
                </div>
              </div>
              
              {/* Footer */}
              <div className="absolute bottom-10 left-12 right-12 flex justify-between items-end">
                <div className="flex flex-col items-center gap-2 w-48">
                  {/* Fake QR using text for now or simple SVG icon if we don't have react-qr */}
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/verify/' + cert.id : '')}`} className="w-20 h-20 p-1.5 bg-white border border-slate-200 rounded-lg" alt="QR" />
                  <div className="font-sans text-[10px] font-bold text-slate-500 text-center leading-tight">
                    امسح الكود<br/>للتحقق من الشهادة
                  </div>
                </div>
                
                <div className="text-center w-48">
                  <div className="w-full h-px bg-[#1A2B4C] mb-2"></div>
                  <div className="font-sans text-sm font-bold text-[#1A2B4C]">مدير المنصة</div>
                  <div className="font-sans text-xs text-[#1A2B4C] mt-1">تاريخ الإصدار: {issuedDate}</div>
                </div>
              </div>
              
              {/* Meta */}
              <div className="absolute bottom-3 left-0 right-0 text-center font-sans text-[10px] text-slate-400">
                رقم الاعتماد: {cert.id.slice(0, 16).toUpperCase()}
              </div>
              
            </div>
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
