import React from "react";
import PremiumFooter from "@/components/landing/premium-footer";

export default function RefundPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0a0a0a] text-white" dir="rtl">
      <div className="py-20 px-4 max-w-4xl mx-auto flex-grow">
        <h1 className="text-4xl font-black text-orange-500 mb-8">سياسة الاسترجاع</h1>
        <div className="space-y-6 text-slate-300 leading-relaxed text-lg">
          <p>نهدف في منصة الأوس الماسية لتقديم أفضل تجربة تعليمية ممكنة. نود التنويه إلى أن <strong>المنصة تقدم محتواها بشكل مجاني وشبه كامل</strong> حرصاً منا على دعم أكبر عدد من الطلاب.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. الاشتراكات المدفوعة</h2>
          <p>عمليات الدفع داخل المنصة هي حالات <strong>استثنائية ومحدودة جداً</strong>، وتكون مخصصة لبعض الباقات الخاصة جداً لتغطية التكاليف التشغيلية. لذلك، المبالغ المدفوعة للاشتراكات <strong>غير قابلة للاسترجاع</strong> بمجرد تفعيل الحساب والوصول للمحتوى الخاص.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. الحالات الاستثنائية والتقنية</h2>
          <p>في حال حدوث خطأ تقني واضح أثناء عملية الدفع (مثل تكرار خصم المبلغ مرتين بالخطأ)، يحق للطالب التواصل مع فريق الدعم الفني لحل المشكلة واسترجاع المبلغ الزائد.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. طريقة التواصل</h2>
          <p>لأي استفسارات مالية أو للإبلاغ عن أخطاء تقنية في الدفع، يرجى التواصل فوراً مع فريق الدعم الفني عبر وسائل التواصل المتاحة في المنصة (واتساب الدعم)، مع إرفاق إيصال الدفع ورقم الحساب لمعالجة الطلب.</p>
        </div>
      </div>
      <PremiumFooter />
    </div>
  );
}
