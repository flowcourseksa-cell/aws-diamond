import React from "react";
import PremiumFooter from "@/components/landing/premium-footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0a0a0a] text-white" dir="rtl">
      <div className="py-20 px-4 max-w-4xl mx-auto flex-grow">
        <h1 className="text-4xl font-black text-orange-500 mb-8">شروط الاستخدام</h1>
        <div className="text-gray-300 leading-loose space-y-6">
          <p>
            مرحباً بك في منصة الأوس الماسية. باستخدامك للمنصة، فإنك توافق على الشروط والأحكام التالية.
          </p>
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. الحساب الشخصي</h2>
          <p>
            أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور. يمنع مشاركة الحساب مع أشخاص آخرين ويعتبر الاشتراك فردياً.
          </p>
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. الملكية الفكرية</h2>
          <p>
            جميع المحتويات المتوفرة في المنصة من فيديوهات، ملفات، نصوص، وشروحات هي ملكية حصرية لمنصة الأوس الماسية ويمنع إعادة نشرها أو توزيعها بأي شكل.
          </p>
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. التغييرات على الشروط</h2>
          <p>
            نحتفظ بالحق في تعديل هذه الشروط في أي وقت، وسيتم إشعار المستخدمين بأي تغييرات جوهرية.
          </p>
        </div>
      </div>
      <PremiumFooter />
    </div>
  );
}
