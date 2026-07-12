"use client";
import React from "react";
import { IconStarFilled } from "@tabler/icons-react";

const ALL_REVIEWS = [
  { name: "عبدالملك العنزي",   text: "شكراً لمنصة الأوس الماسية، الدورة التأسيسية كانت شاملة ومفهومة جداً وجبت درجة عالية بفضل الله ثم فضلكم.", emoji: "👨‍🎓" },
  { name: "ريما محمد",          text: "مررره رهيببببين وترا جبت درجة عالية ماشاءالله، وأنا ما ذاكرت إلا من عندكم، الأساتذة كثيرين وبيلقون اللي يناسبهم، شرح غير طبيعي.", emoji: "👩‍🎓" },
  { name: "غلا",                text: "تجنننن أحسها اختصرت علي مراااا وقت وجهد، الملازم مرتبة تفتح النفس للمذاكرة.", emoji: "👩‍🏫" },
  { name: "فيصل الحربي",        text: "والله ما تخيلت إن في منصة بهالجودة، شرح الدكاترة واضح جداً والتجميعات حصرية ما تلاقيها في مكان ثاني.", emoji: "👨‍🎓" },
  { name: "نورة السعيدي",       text: "المنصة غيرت أسلوب مذاكرتي كلياً، الخطة الأسبوعية والتتبع ساعدوني أوصل لهدفي بوقت قياسي.", emoji: "👩‍🎓" },
  { name: "محمد العتيبي",       text: "أنصح كل طالب ومطلب ريدت القدرات يشترك، المواد شاملة والشرح ما شاء الله ما يخلي حاجة للمصادر الثانية.", emoji: "👨‍🏫" },
  { name: "سارة الزهراني",      text: "جبت في القدرات اللفظي والكمي درجة عالية وكل الفضل لله ثم لهذه المنصة الرائعة، ملازمكم خير من أي كتاب.", emoji: "👩‍🎓" },
  { name: "خالد المطيري",       text: "الله يبارك فيكم، استثمرت فيكم وكانت أفضل قرار. جبت ٩٢ بالقدرات وأنا كنت خايف من الاختبار.", emoji: "👨‍🎓" },
  { name: "لمى القحطاني",       text: "التصميم جميل ومريح للعين والشرح واضح، حسيت إن ذاكرت بهدوء ومركزة طول الفترة.", emoji: "👩‍💻" },
  { name: "عمر الغامدي",        text: "ما توقعت إن في منصة عربية بهذا المستوى، وترا جميع شروحات الأوس واضحة وعميقة، الله يوفقكم.", emoji: "👨‍🎓" },
  { name: "رهف العنزي",         text: "جزاكم الله خيراً من قلبي، بكيت لما شفت نتيجتي. المنصة كانت رفيقتي طول فترة الاستعداد.", emoji: "👩‍🎓" },
  { name: "بدر الشمري",         text: "كل شيء متكامل، من الشرح للملازم للاختبارات التجريبية. ما احتجت أكمل بمصدر آخر.", emoji: "👨‍🏫" },
  { name: "دانة المطيري",       text: "جبت تسعين بالقدرات الكمي بسبب الأوس الماسية، والله ما أنسى هذه المنصة وشكراً.", emoji: "👩‍🎓" },
  { name: "عبدالرحمن الدوسري",  text: "واحد من أهم القرارات في حياتي إني اشتركت هنا. طريقة الشرح تفتح الذهن وما تحس بملل.", emoji: "👨‍🎓" },
  { name: "منار الصبيحي",       text: "المنصة بصراحة تختلف عن كل اللي جربته، الاختبارات التدريبية ساعدتني أعرف نقاط ضعفي.", emoji: "👩‍🎓" },
  { name: "تركي الرشيدي",       text: "اشتركت بسبب توصية صديق وما ندمت، بالعكس أنا اللي صرت أوصي الكل بالأوس الماسية.", emoji: "👨‍🎓" },
  { name: "هيا الشهري",         text: "الله يجزاكم خير، جبت ٩٥ في التحصيلي وأنا مصدقة نفسي. الملازم فيها كل شيء.", emoji: "👩‍🏫" },
  { name: "سلطان العتيبي",      text: "الخطة الدراسية المنظمة ساعدتني ما أضيع وقت وأكون مركز في المهم. جزاكم الله خيراً.", emoji: "👨‍💻" },
  { name: "وفاء المالكي",       text: "أول ما دخلت المنصة حسيت الفرق، تنظيم عالي وشرح احترافي ومحتوى شامل.", emoji: "👩‍🎓" },
  { name: "أحمد القرني",        text: "ما تخيلت إن الكمي ممكن يكون سهل قبل ما أشترك، الأوس فكت عندي عقدة الرياضيات.", emoji: "👨‍🎓" },
  { name: "شوق الحارثي",        text: "جميل جداً إن المنصة تراعي مستويات مختلفة، سواء مبتدئ أو متقدم تلاقي اللي يناسبك.", emoji: "👩‍🎓" },
  { name: "يوسف السهلي",        text: "ملازم الأوس من أفضل ما رأيت في حياتي، منظمة ومركزة وتوفر الكثير من الوقت.", emoji: "👨‍🎓" },
  { name: "عبير الحازمي",       text: "من أول أسبوع لاحظت تحسن واضح في قدرتي على حل الأسئلة. منصة تستحق كل ريال دفعته.", emoji: "👩‍💻" },
  { name: "ماجد الدوسري",       text: "الدعم الفني سريع الاستجابة وهذا شيء نادر في المنصات العربية. شكراً جزيلاً.", emoji: "👨‍🎓" },
  { name: "لجين الشمري",        text: "تعديت مخاوفي من الكمي بفضل الشروحات المبسطة والتدريج الصحيح في الأسئلة.", emoji: "👩‍🎓" },
  { name: "فهد العمري",         text: "جبت ٩١ في القدرات وأنا صح متفاجئ من نفسي، الأوس الماسية بصدق صنعت الفرق.", emoji: "👨‍🏫" },
  { name: "رنا الزياد",         text: "من أجمل ما في المنصة تتبع التقدم الشخصي، يخليك تحس بالإنجاز وتكمل بحماس أكثر.", emoji: "👩‍🎓" },
  { name: "عثمان الصاعدي",      text: "شرح الجزء اللغوي كان ممتازاً، ما توقعت إن قواعد اللغة ممكن تكون بهذه الطريقة السهلة.", emoji: "👨‍🎓" },
  { name: "نادين الفيفي",       text: "قدمت الاختبار بثقة كاملة بعد ما أنهيت المواد. المنصة ولدت عندي ثقة بالنفس.", emoji: "👩‍🎓" },
  { name: "حمد الحربي",         text: "أسلوب التلعيب في الاختبارات التدريبية حمسني أكمل، ما حسيت بوقت المذاكرة.", emoji: "👨‍🎓" },
  { name: "ضحى العسيري",        text: "والله تعبت من كثر البحث عن مصادر قبل ما أجي الأوس، هنا كل شيء في مكان واحد.", emoji: "👩‍🎓" },
  { name: "سعد البلوي",         text: "أخوي اشترك وجاب نتيجة ممتازة، انا كمان اشتركت وما ندمت، العيلة كلها مشتركة الحين.", emoji: "👨‍💻" },
  { name: "تسنيم العمري",       text: "أشكر فريق الأوس الماسية من قلبي، وصلت لهدفي وأنا ما كنت مصدقة إن الرقم ممكن يوصل.", emoji: "👩‍🎓" },
  { name: "وليد المرزوقي",      text: "المنصة تشتغل بشكل ممتاز حتى من الجوال، ذاكرت في أي وقت وأي مكان بدون مشاكل.", emoji: "👨‍🎓" },
  { name: "أميرة السلمي",       text: "ما جاء اليوم اللي أحوج فيه مصدر ثاني، الأوس فيه كل ما يحتاجه الطالب من ألفه لياءه.", emoji: "👩‍🏫" },
  { name: "بلال الجهني",        text: "الشرح العميق للمفاهيم غير الأسلوب عندي كلياً، من حفظ لفهم حقيقي.", emoji: "👨‍🎓" },
  { name: "حصة الحميدي",        text: "اختبارات تجريبية بمستوى مطابق للاختبار الحقيقي، حين دخلت الاختبار حسيت إني ذاكرت نفس الأسئلة.", emoji: "👩‍🎓" },
  { name: "معاذ الزهراني",      text: "سعر الاشتراك يستاهل ألف مرة مقارنة بما تقدمه المنصة من محتوى. استثمار حقيقي.", emoji: "👨‍🎓" },
  { name: "بشرى المطلق",        text: "التنظيم الجميل للمواد جعل مذاكرتي ممنهجة، ما ضيعت وقت في البحث عن ماذا أذاكر.", emoji: "👩‍💻" },
  { name: "خلود السبيعي",       text: "من أفضل قرارات سنتي إني اشتركت في الأوس الماسية. النتيجة الحمد لله فوق توقعاتي.", emoji: "👩‍🎓" },
  { name: "عبدالله الشريف",     text: "التعليقات الصوتية من المعلمين على الأخطاء أشياء ما لقيتها في أي منصة ثانية.", emoji: "👨‍🎓" },
  { name: "مها الغامدي",        text: "حتى التصميم البصري للمنصة يساعدك على التركيز، مريح للعين ومحفز للعقل.", emoji: "👩‍🎓" },
  { name: "عبدالعزيز السويلم",   text: "جبت في القدرات الكمي ٩٨ بالمئة. ما توقعت هذا الرقم بصراحة. الأوس بصدق صنع الفرق.", emoji: "👨‍🏫" },
  { name: "رغد الجدعاني",       text: "التنوع في أساليب الشرح بين الفيديو والملازم والاختبارات جعل التعلم أكثر عمقاً.", emoji: "👩‍🎓" },
  { name: "ناصر الرشيدي",       text: "اشتريت اشتراك لولدي وهو الآن في الجامعة التي يحلم بها، شكراً من أب فخور.", emoji: "👨‍👦" },
  { name: "هند الجهني",         text: "المواد مرتبة بشكل يساعدك تبني معرفتك بشكل صحيح خطوة بخطوة دون فجوات.", emoji: "👩‍🎓" },
  { name: "فارس العنزي",        text: "كل يوم كنت أفتح المنصة بشغف، الاختبارات التنافسية مع الطلاب الثانيين محمسة جداً.", emoji: "👨‍🎓" },
  { name: "إيمان الحازمي",      text: "الدورة حولت خوفي من الاختبار لثقة، وهذا أغلى شيء استفدته من الأوس الماسية.", emoji: "👩‍💻" },
  { name: "طلال الحربي",        text: "أنصح الجميع بالأوس الماسية لأنها تقدم محتوى احترافي بأسلوب مبسط وجذاب.", emoji: "👨‍🎓" },
  { name: "ليلى الزياد",        text: "جبت ٩٤ في التحصيلي اللي كنت خايفة منه أكثر من القدرات، الأوس غطى كل شيء.", emoji: "👩‍🎓" },
];

// Duplicate for seamless infinite scroll
const ROW1 = [...ALL_REVIEWS.slice(0, 25), ...ALL_REVIEWS.slice(0, 25)];
const ROW2 = [...ALL_REVIEWS.slice(25),    ...ALL_REVIEWS.slice(25)];

function ReviewCard({ name, text, emoji }: { name: string; text: string; emoji: string }) {
  return (
    <div className="flex-shrink-0 w-[320px] md:w-[360px] bg-white rounded-3xl p-7 shadow-[0_4px_24px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col gap-4 mx-3 select-none">
      <div className="flex gap-1 text-amber-400">
        {[1,2,3,4,5].map(i => <IconStarFilled key={i} size={16} />)}
      </div>
      <p className="text-slate-600 font-medium leading-relaxed text-[15px] flex-1 line-clamp-4">
        {text.replace(/،/g, " ")}
      </p>
      <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
        <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center text-xl shadow-inner border border-white">
          {emoji}
        </div>
        <div>
          <span className="font-bold text-slate-800 block text-sm">{name}</span>
          <span className="text-xs text-slate-400 font-medium">طالب في منصة الأوس الماسية</span>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-slate-50 overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="text-center mb-16 px-4">
        <span className="text-amber-500 font-bold tracking-wider text-sm mb-3 block">شركاء النجاح</span>
        <h2 className="text-4xl md:text-5xl font-black text-slate-800">
          ماذا يقول <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">الأبطال</span>؟
        </h2>

      </div>

      {/* Row 1 — scrolls right (visually) */}
      <div className="mb-8 relative w-full" dir="ltr">
        <div className="flex w-max animate-[scroll-ltr_180s_linear_infinite] hover:[animation-play-state:paused]">
          <div className="flex gap-6 pr-6">
            {ALL_REVIEWS.slice(0, 25).map((rev, i) => (
              <div key={`r1a-${i}`} dir="rtl"><ReviewCard {...rev} /></div>
            ))}
          </div>
          <div className="flex gap-6 pr-6">
            {ALL_REVIEWS.slice(0, 25).map((rev, i) => (
              <div key={`r1b-${i}`} dir="rtl"><ReviewCard {...rev} /></div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2 — scrolls left (visually) */}
      <div className="relative w-full" dir="ltr">
        <div className="flex w-max animate-[scroll-rtl_180s_linear_infinite] hover:[animation-play-state:paused]">
          <div className="flex gap-6 pr-6">
            {ALL_REVIEWS.slice(25).map((rev, i) => (
              <div key={`r2a-${i}`} dir="rtl"><ReviewCard {...rev} /></div>
            ))}
          </div>
          <div className="flex gap-6 pr-6">
            {ALL_REVIEWS.slice(25).map((rev, i) => (
              <div key={`r2b-${i}`} dir="rtl"><ReviewCard {...rev} /></div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-ltr {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-rtl {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}
