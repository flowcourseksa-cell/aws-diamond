import React from "react";
import PremiumFooter from "@/components/landing/premium-footer";
import HeroSection from "@/components/landing/hero-section"; // using hero-section to reuse header for now or we can make a standalone header. Let's make a simple page.

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0a0a0a] text-white" dir="rtl">
      <div className="py-20 px-4 max-w-4xl mx-auto flex-grow">
        <h1 className="text-4xl font-black text-orange-500 mb-8">سياسة الخصوصية</h1>
        <div className="text-gray-300 leading-loose space-y-6">
          <p>
            في منصة الأوس الماسية، نولي أهمية قصوى لخصوصية بياناتك. توضح هذه السياسة كيف نقوم بجمع واستخدام وحماية معلوماتك الشخصية.
          </p>
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. جمع المعلومات</h2>
          <p>
            نقوم بجمع المعلومات التي تقدمها لنا مباشرة عند التسجيل في المنصة، مثل الاسم، البريد الإلكتروني، ورقم الهاتف.
          </p>
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. استخدام المعلومات</h2>
          <p>
            تستخدم المعلومات لتوفير الخدمات التعليمية لك، ولتحسين تجربتك في المنصة، وللتواصل معك بخصوص أي تحديثات أو إشعارات هامة.
          </p>
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. حماية البيانات</h2>
          <p>
            نحن نستخدم تدابير أمنية متقدمة لحماية معلوماتك من الوصول غير المصرح به، ونلتزم بعدم بيع أو مشاركة بياناتك مع أي طرف ثالث لأغراض تجارية.
          </p>
        </div>
      </div>
      <PremiumFooter />
    </div>
  );
}
