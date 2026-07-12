"use client";

import React, { useEffect } from "react";
import { IconX } from "@tabler/icons-react";

type PolicyType = "privacy" | "terms" | "refund" | null;

interface PolicyModalProps {
  type: PolicyType;
  isOpen: boolean;
  onClose: () => void;
}

const POLICY_CONTENT = {
  privacy: {
    title: "سياسة الخصوصية",
    content: (
      <div className="space-y-6 text-slate-300 leading-relaxed">
        <p>في منصة الأوس الماسية، نولي أهمية قصوى لخصوصية بياناتك. توضح هذه السياسة كيف نقوم بجمع واستخدام وحماية معلوماتك الشخصية.</p>
        <h2 className="text-xl font-bold text-white mt-6 mb-3">1. جمع المعلومات</h2>
        <p>نقوم بجمع المعلومات التي تقدمها لنا مباشرة عند التسجيل في المنصة، مثل الاسم، البريد الإلكتروني، ورقم الهاتف.</p>
        <h2 className="text-xl font-bold text-white mt-6 mb-3">2. استخدام المعلومات</h2>
        <p>تستخدم المعلومات لتوفير الخدمات التعليمية لك، ولتحسين تجربتك في المنصة، وللتواصل معك بخصوص أي تحديثات أو إشعارات هامة.</p>
        <h2 className="text-xl font-bold text-white mt-6 mb-3">3. حماية البيانات</h2>
        <p>نحن نستخدم تدابير أمنية متقدمة لحماية معلوماتك من الوصول غير المصرح به، ونلتزم بعدم بيع أو مشاركة بياناتك مع أي طرف ثالث لأغراض تجارية.</p>
      </div>
    )
  },
  terms: {
    title: "شروط الاستخدام",
    content: (
      <div className="space-y-6 text-slate-300 leading-relaxed">
        <p>مرحباً بك في منصة الأوس الماسية. باستخدامك للمنصة، فإنك توافق على الشروط والأحكام التالية.</p>
        <h2 className="text-xl font-bold text-white mt-6 mb-3">1. الحساب الشخصي</h2>
        <p>أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور. يمنع مشاركة الحساب مع أشخاص آخرين ويعتبر الاشتراك فردياً.</p>
        <h2 className="text-xl font-bold text-white mt-6 mb-3">2. الملكية الفكرية</h2>
        <p>جميع المحتويات المتوفرة في المنصة من فيديوهات، ملفات، نصوص، وشروحات هي ملكية حصرية لمنصة الأوس الماسية ويمنع إعادة نشرها أو توزيعها بأي شكل.</p>
        <h2 className="text-xl font-bold text-white mt-6 mb-3">3. التغييرات على الشروط</h2>
        <p>نحتفظ بالحق في تعديل هذه الشروط في أي وقت، وسيتم إشعار المستخدمين بأي تغييرات جوهرية.</p>
      </div>
    )
  },
  refund: {
    title: "سياسة الاسترجاع",
    content: (
      <div className="space-y-6 text-slate-300 leading-relaxed">
        <p>نهدف في منصة الأوس الماسية لتقديم أفضل تجربة تعليمية ممكنة. نود التنويه إلى أن <strong>المنصة تقدم محتواها بشكل مجاني وشبه كامل</strong> حرصاً منا على دعم أكبر عدد من الطلاب.</p>
        <h2 className="text-xl font-bold text-white mt-6 mb-3">1. الاشتراكات المدفوعة</h2>
        <p>عمليات الدفع داخل المنصة هي حالات <strong>استثنائية ومحدودة جداً</strong>، وتكون مخصصة لبعض الباقات الخاصة جداً لتغطية التكاليف التشغيلية. لذلك، المبالغ المدفوعة للاشتراكات <strong>غير قابلة للاسترجاع</strong> بمجرد تفعيل الحساب والوصول للمحتوى الخاص.</p>
        <h2 className="text-xl font-bold text-white mt-6 mb-3">2. الحالات الاستثنائية والتقنية</h2>
        <p>في حال حدوث خطأ تقني واضح أثناء عملية الدفع (مثل تكرار خصم المبلغ مرتين بالخطأ)، يحق للطالب التواصل مع فريق الدعم الفني لحل المشكلة.</p>
        <h2 className="text-xl font-bold text-white mt-6 mb-3">3. طريقة التواصل</h2>
        <p>لأي استفسارات مالية أو أخطاء تقنية، يرجى التواصل فوراً مع فريق الدعم الفني عبر وسائل التواصل المتاحة في المنصة (واتساب الدعم)، مع إرفاق إيصال الدفع ورقم الحساب.</p>
      </div>
    )
  }
};

export default function PolicyModal({ type, isOpen, onClose }: PolicyModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen || !type) return null;

  const currentPolicy = POLICY_CONTENT[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-2xl bg-[#1a1a1a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-black text-orange-500">{currentPolicy.title}</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {currentPolicy.content}
        </div>
      </div>
    </div>
  );
}
