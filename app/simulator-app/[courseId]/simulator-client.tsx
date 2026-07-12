"use client";

import { useState, useEffect, useRef } from "react";
import { IconClock, IconChevronRight, IconChevronLeft, IconFlag, IconCheck, IconAward, IconRefresh, IconArrowRight, IconChartPie, IconShare, IconDownload, IconSchool, IconAlertTriangle } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createCertificate } from "@/lib/supabase/services/certificates";
import { toPng } from "html-to-image";

type SimulatorClientProps = {
  courseId: string;
  initialExam: any | null;
};

// Mock data for STEP Simulator if no exam is found or to simulate the UI from the screenshot
const MOCK_QUESTIONS = [
  {
    id: "q1",
    text: "Which of the following would be the most suitable title for the passage?",
    context_text: "According to recent studies, the integration of artificial intelligence in educational systems has significantly altered traditional learning paradigms. Students who engage with AI-driven adaptive learning platforms show a 40% increase in retention rates over a 6-month period compared to those using standard textbooks. Furthermore, these systems allow educators to pinpoint specific knowledge gaps in real-time. However, critics argue that over-reliance on technology may diminish critical thinking skills and reduce human-to-human interaction, which is vital for emotional intelligence development.\n\nDespite these concerns, the undeniable efficiency of automated assessment tools is prompting more schools globally to adopt hybrid models. The debate continues, but the consensus leans towards a balanced approach where AI serves as a supplementary tutor rather than a complete replacement for human teachers.",
    options: [
      { id: "o1", text: "The History of Education", is_correct: false },
      { id: "o2", text: "Artificial Intelligence in the Classroom", is_correct: true },
      { id: "o3", text: "How to Build an AI Platform", is_correct: false },
      { id: "o4", text: "The Decline of Human Teachers", is_correct: false },
    ]
  },
  {
    id: "q2",
    text: "What does the word 'paradigms' in the first paragraph refer to?",
    context_text: "According to recent studies, the integration of artificial intelligence in educational systems has significantly altered traditional learning paradigms. Students who engage with AI-driven adaptive learning platforms show a 40% increase in retention rates over a 6-month period compared to those using standard textbooks. Furthermore, these systems allow educators to pinpoint specific knowledge gaps in real-time. However, critics argue that over-reliance on technology may diminish critical thinking skills and reduce human-to-human interaction, which is vital for emotional intelligence development.\n\nDespite these concerns, the undeniable efficiency of automated assessment tools is prompting more schools globally to adopt hybrid models. The debate continues, but the consensus leans towards a balanced approach where AI serves as a supplementary tutor rather than a complete replacement for human teachers.",
    options: [
      { id: "o1", text: "Financial models", is_correct: false },
      { id: "o2", text: "Computer hardware", is_correct: false },
      { id: "o3", text: "Standard models or patterns", is_correct: true },
      { id: "o4", text: "Student behaviors", is_correct: false },
    ]
  },
  {
    id: "q3",
    text: "Choose the correct word to complete the sentence: He ______ to the store yesterday.",
    context_text: null,
    options: [
      { id: "o1", text: "go", is_correct: false },
      { id: "o2", text: "goes", is_correct: false },
      { id: "o3", text: "went", is_correct: true },
      { id: "o4", text: "gone", is_correct: false },
    ]
  }
];

export function SimulatorClient({ courseId, initialExam }: SimulatorClientProps) {
  const router = useRouter();
  
  // Use DB questions if they exist and are not empty, otherwise use mock data for the realistic simulator feel
  const questions = initialExam && initialExam.questions.length > 0 
    ? initialExam.questions
    : MOCK_QUESTIONS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(initialExam?.time_limit_minutes ? initialExam.time_limit_minutes * 60 : 60 * 60); // default 60 mins
  const [isFinished, setIsFinished] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [userName, setUserName] = useState("طالب الأوس الماسية");
  
  const searchParams = useSearchParams();
  const autoNextEnabled = searchParams.get('autoNext') !== 'false'; // defaults to true if not explicitly false

  useEffect(() => {
    // Attempt to enter fullscreen when the test starts (if not finished)
    if (!isFinished && typeof document !== "undefined") {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      }
    }

    // Prevent accidental refresh or back button
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isFinished) {
        e.preventDefault();
        e.returnValue = ""; // Required for Chrome
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Exit fullscreen if finished or unmounting
      if (typeof document !== "undefined" && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [isFinished]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.user_metadata?.full_name) {
        setUserName(data.user.user_metadata.full_name);
      } else if (data?.user?.email) {
        setUserName(data.user.email.split('@')[0]);
      }
    });
  }, []);
  
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSelect = (optionId: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionId }));
    
    // Auto-next feature
    if (autoNextEnabled && currentIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 350); // slight delay so the user sees their selection click effect
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const handleFinish = () => {
    setShowEndModal(true);
  };

  const certificateRef = useRef<HTMLDivElement>(null);
  const [certId, setCertId] = useState<string | null>(null);

  useEffect(() => {
    if (isFinished && !certId && questions.length > 0) {
      const saveScore = async () => {
        let score = 0;
        questions.forEach((q: any) => {
          const selected = answers[q.id];
          const correct = q.options.find((o: any) => o.is_correct)?.id;
          if (selected === correct) score++;
        });
        const percentage = Math.round((score / questions.length) * 100);

        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        const studentId = userData?.user?.id || 'anonymous';
        
        const newCert = await createCertificate({
          student_id: studentId,
          course_id: courseId,
          final_exam_id: initialExam?.id || null,
          score_pct: percentage,
          student_name: userName || 'طالب متميز',
          course_title: initialExam?.title || 'محاكي اختبار ستيب'
        });
        
        if (newCert) {
          setCertId(newCert.id);
        }
      };

      saveScore();
    }
  }, [isFinished, certId, questions, answers, courseId, initialExam, userName]);

  const handleRetake = () => {
    setAnswers({});
    setCurrentIndex(0);
    setIsFinished(false);
    setTimeLeft(initialExam?.time_limit_minutes ? initialExam.time_limit_minutes * 60 : 60 * 60);
  };

  const handleDownloadCertificate = async () => {
    if (!certificateRef.current) return;
    try {
      // Temporarily intercept window errors to prevent Next.js overlay
      const errorHandler = (e: ErrorEvent) => {
        if (e.message && e.message.includes('cssRules')) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      window.addEventListener('error', errorHandler, true);

      // Filter out external stylesheets that cause the CORS SecurityError
      const filter = (node: HTMLElement) => {
        if (node.tagName === 'LINK') {
          return false;
        }
        return true;
      };

      const dataUrl = await toPng(certificateRef.current, { 
        quality: 1, 
        pixelRatio: 2,
        backgroundColor: '#ffffff', // Ensure it doesn't have transparent gaps if any
        filter: filter as any
      });

      window.removeEventListener('error', errorHandler, true);

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `STEP_Certificate_${userName.replace(/\s+/g, '_')}.png`;
      link.click();
    } catch (err) {
      console.error("Failed to download certificate:", err);
      // We don't want to alert if it's just the known cssRules error
      if (!(err instanceof Error) || !err.message.includes('cssRules')) {
        alert("حدث خطأ أثناء تحميل الشهادة");
      }
    }
  };

  const handleShare = async () => {
    try {
      let finalCertId = certId;
      
      // Calculate score if not done yet
      let score = 0;
      questions.forEach((q: any) => {
        const selected = answers[q.id];
        const correct = q.options.find((o: any) => o.is_correct)?.id;
        if (selected === correct) score++;
      });
      const percentage = Math.round((score / questions.length) * 100);

      if (!finalCertId && percentage >= 50) {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        const studentId = userData?.user?.id || 'anonymous';
        
        const newCert = await createCertificate({
          student_id: studentId,
          course_id: courseId,
          final_exam_id: initialExam?.id || null,
          score_pct: percentage,
          student_name: userName,
          course_title: 'محاكي الأوس الماسية'
        });
        
        if (newCert) {
          finalCertId = newCert.id;
          setCertId(newCert.id);
        }
      }

      const shareUrl = finalCertId 
        ? `${window.location.origin}/certificate/${finalCertId}`
        : window.location.href;

      if (navigator.share) {
        await navigator.share({
          title: 'شهادة إتمام محاكي ستيب',
          text: `لقد اجتزت للتو محاكي اختبار ستيب (STEP) بنجاح وحصلت على درجة ممتازة على منصة الأوس الماسية!`,
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

  if (isFinished) {
    let score = 0;
    const sections: Record<string, { total: number; correct: number; label: string }> = {
      reading: { total: 0, correct: 0, label: "الاستيعاب المقروء" },
      grammar: { total: 0, correct: 0, label: "التراكيب النحوية" },
      listening: { total: 0, correct: 0, label: "فهم المسموع" },
      analysis: { total: 0, correct: 0, label: "التحليل الكتابي" }
    };

    questions.forEach((q: any) => {
      const selected = answers[q.id];
      const correct = q.options.find((o: any) => o.is_correct)?.id;
      const type = q.section_type || 'grammar';
      
      if (!sections[type]) sections[type] = { total: 0, correct: 0, label: type };
      
      sections[type].total++;
      if (selected === correct) {
        score++;
        sections[type].correct++;
      }
    });

    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 50;

    const getEstimationMessage = (pct: number, examTitle: string) => {
      const TitleSpan = () => <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded mx-1 whitespace-nowrap">"{examTitle}"</span>;
      if (pct >= 85) return <>قد اجتاز بنجاح وتفوق <TitleSpan /> وحصل على درجة (ممتاز)، مما يعكس استعداده التام لاجتياز الاختبار الحقيقي بثقة عالية.</>;
      if (pct >= 75) return <>قد اجتاز بنجاح <TitleSpan /> وحصل على درجة (جيد جداً)، مما يعكس مستوى متقدماً وجاهزية ممتازة للاختبار الحقيقي.</>;
      if (pct >= 65) return <>قد اجتاز بنجاح <TitleSpan /> وحصل على درجة (جيد)، مما يعكس تحضيراً مناسباً للاختبار الحقيقي.</>;
      return <>قد اجتاز <TitleSpan /> وحصل على درجة (مقبول)، مما يعكس إلماماً بالأساسيات، مع أمنياتنا له بمزيد من التوفيق.</>;
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans overflow-y-auto" dir="rtl">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 my-auto">
          
          {/* Certificate & Main Score Area */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-orange-600 to-amber-700 opacity-10"></div>
            
            {passed ? (
              <div className="w-24 h-24 bg-gradient-to-br from-amber-300 to-yellow-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/40 relative z-10 border-4 border-white">
                <IconAward size={48} stroke={2} />
              </div>
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md relative z-10 border-4 border-white">
                <IconChartPie size={48} stroke={2} />
              </div>
            )}
            
            <h1 className="text-4xl font-black text-slate-800 mb-2 z-10 tracking-tight">
              {passed ? "تهانينا، اجتزت الاختبار!" : "انتهى الاختبار"}
            </h1>
            <p className="text-slate-500 mb-8 font-medium z-10 text-lg">
              {passed ? "لقد أظهرت مستوى متميزاً في اختبار المحاكي." : "فرصة ممتازة للتدريب، يمكنك المحاولة مرة أخرى."}
            </p>

            {/* Certificate Style Box */}
            {passed && (
              <div className="w-full relative mb-8 group">
                <div 
                  ref={certificateRef}
                  className="w-full min-h-[500px] md:min-h-[600px] bg-white rounded-xl text-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between p-8 md:p-12"
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
                      {userName || 'متدرب في الأوس الماسية'}
                    </div>

                    {/* Description text */}
                    <p className="text-slate-600 text-sm md:text-lg leading-relaxed font-bold w-full max-w-2xl mb-8 md:mb-12">
                      {getEstimationMessage(percentage, initialExam?.title || 'محاكي اختبار ستيب')}
                    </p>

                    {/* Bottom Signature & Score Block */}
                    <div className="flex items-end justify-between w-full mt-auto pt-4 md:pt-8 px-2 md:px-8">
                      <div className="text-center w-24 md:w-32">
                        <div className="border-b-2 border-slate-300 mb-2 w-full"></div>
                        <div className="text-slate-500 text-[10px] md:text-xs font-bold uppercase">إدارة المنصة</div>
                      </div>
                      
                      <div className="text-center flex flex-col items-center px-4">
                        <div className="text-slate-500 text-[10px] md:text-xs font-bold mb-1 uppercase tracking-wider">الدرجة النهائية</div>
                        <div className="text-4xl md:text-6xl font-black text-orange-600 leading-none">{percentage}%</div>
                      </div>

                      <div className="text-center w-24 md:w-32">
                        <div className="text-slate-800 text-xs md:text-sm font-bold mb-1">{new Date().toLocaleDateString('en-GB')}</div>
                        <div className="border-b-2 border-slate-300 mb-2 w-full"></div>
                        <div className="text-slate-500 text-[10px] md:text-xs font-bold uppercase">تاريخ الإصدار</div>
                      </div>
                    </div>
                  </div>

                  {/* Legal Disclaimer (Now purely relative flow, NO absolute positioning) */}
                  <div className="w-full text-center z-10 mt-8 md:mt-12 mb-2 md:mb-4 px-4 md:px-8">
                    <p className="text-[8px] md:text-[10px] text-slate-400 font-medium leading-tight text-center">
                      * تنويه: هذه الشهادة هي توثيق لاجتياز اختبار محاكي للتدريب على منصة الأوس الماسية فقط. ولا تمثل أو تغني عن الاختبار الحقيقي الرسمي، ولا يترتب عليها أي التزام أو مسؤولية قانونية أو أكاديمية.
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons overlay for certificate */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button onClick={handleDownloadCertificate} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors border border-orange-100">
                    <IconDownload size={18} />
                    تحميل كصورة
                  </button>
                  <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors border border-orange-100">
                    <IconShare size={18} />
                    مشاركة
                  </button>
                </div>
              </div>
            )}

            {!passed && (
              <div className="bg-slate-50 rounded-2xl p-8 mb-8 border border-slate-100 w-full">
                <div className="text-sm font-bold text-slate-400 mb-2">النتيجة التقريبية</div>
                <div className="text-6xl font-black text-slate-700">{percentage}%</div>
                <div className="text-sm font-semibold text-slate-500 mt-3">أجبت على {score} من {questions.length} أسئلة بشكل صحيح</div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-auto">
              <button onClick={handleRetake} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors">
                <IconRefresh size={20} />
                إعادة المحاولة
              </button>
              <button onClick={() => router.push(`/simulator/${courseId}`)} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-lg shadow-orange-500/20">
                العودة للمحاكي
                <IconArrowRight size={20} className="rotate-180" />
              </button>
            </div>
          </div>

          {/* Detailed Analytics Area */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 flex flex-col">
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <IconChartPie className="text-orange-600" />
              تحليل الأداء والتفاصيل
            </h2>
            
            <p className="text-slate-500 mb-6 text-sm font-medium leading-relaxed">
              هذا التحليل يوضح لك نقاط القوة والضعف في أقسام اختبار ستيب المختلفة، لكي تركز على تطوير الأقسام التي تحتاج إلى تحسين.
            </p>

            <div className="flex flex-col gap-4 flex-1">
              {Object.entries(sections).map(([key, data]) => {
                if (data.total === 0) return null;
                const secPercent = Math.round((data.correct / data.total) * 100) || 0;
                
                // Color logic based on performance
                let colorClass = "bg-rose-500";
                let textClass = "text-rose-600";
                let bgLightClass = "bg-rose-50";
                if (secPercent >= 80) { colorClass = "bg-emerald-500"; textClass = "text-emerald-600"; bgLightClass = "bg-emerald-50"; }
                else if (secPercent >= 50) { colorClass = "bg-amber-500"; textClass = "text-amber-600"; bgLightClass = "bg-amber-50"; }

                return (
                  <div key={key} className={`p-4 rounded-2xl border border-slate-100 ${bgLightClass}`}>
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <div className="font-bold text-slate-800">{data.label}</div>
                        <div className="text-xs font-semibold text-slate-500 mt-1">
                          {data.correct} من {data.total} أسئلة صحيحة
                        </div>
                      </div>
                      <div className={`text-xl font-black ${textClass}`}>
                        {secPercent}%
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colorClass} rounded-full transition-all duration-1000 ease-out`} 
                        style={{ width: `${secPercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 p-4 bg-orange-50/50 rounded-xl border border-orange-100 text-sm text-orange-800 font-medium leading-relaxed">
              <strong className="font-black text-orange-900 block mb-1">نصيحة المنصة:</strong>
              {percentage >= 80 
                ? "أداؤك ممتاز جداً! أنت مستعد لدخول الاختبار الحقيقي بكل ثقة. استمر في التدرب للحفاظ على مستواك."
                : percentage >= 50
                ? "أداؤك جيد، ولكن يمكنك تحقيق نتيجة أفضل. ركز على الأقسام التي تلونت باللون الأحمر أو البرتقالي في التحليل أعلاه."
                : "لا تيأس! اختبار ستيب يحتاج إلى تدريب مستمر. ننصحك بمراجعة دورات التأسيس في المنصة وإعادة الاختبار."}
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans select-none" dir="ltr">
      {/* End Test Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4" dir="rtl">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <IconAlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-black text-center text-slate-800 mb-3">إنهاء الاختبار؟</h3>
            <p className="text-sm font-semibold text-center text-slate-500 mb-8 leading-relaxed">
              هل أنت متأكد من إنهاء الاختبار وتسليم إجاباتك؟ لن تتمكن من التعديل بعد ذلك وسيتم احتساب درجتك فوراً.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowEndModal(false)}
                className="flex-1 py-3.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                إلغاء التراجع
              </button>
              <button
                onClick={() => {
                  setShowEndModal(false);
                  setIsFinished(true);
                }}
                className="flex-1 py-3.5 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 shadow-lg shadow-rose-500/30 transition-all hover:-translate-y-0.5"
              >
                إنهاء الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="h-16 bg-[#2B2D31] flex items-center justify-between px-6 text-white shadow-md z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={handleFinish} className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-6 rounded-md transition-colors text-sm">
            انهاء الاختبار
          </button>
          <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-lg bg-black/20 px-4 py-1.5 rounded-md">
            <IconClock size={20} />
            {formatTime(timeLeft)}
          </div>
        </div>
        
        <div className="flex items-center gap-6" dir="rtl">
          <div className="text-right">
            <h1 className="font-bold text-sm text-slate-200">{initialExam?.title || "اختبار ستيب الشامل التجريبي"}</h1>
            <div className="text-xs text-slate-400 font-semibold mt-0.5">
              السؤال {currentIndex + 1} من {questions.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-md bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
            <span className="font-black text-xl leading-none">{currentIndex + 1}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col-reverse md:flex-row overflow-hidden">
        {/* Left Side: Question (Takes full width if no context) */}
        <div className={`flex-1 flex flex-col bg-white overflow-y-auto ${currentQuestion.context_text ? 'md:border-r border-slate-200' : ''}`}>
          <div className="p-10 max-w-3xl mx-auto w-full">
            <div className="mb-8">
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold uppercase tracking-wider mb-4 border border-slate-200">
                Question {currentIndex + 1}
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-snug">
                {currentQuestion.text}
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              {currentQuestion.options.map((opt: any, i: number) => {
                const isSelected = answers[currentQuestion.id] === opt.id;
                const letter = String.fromCharCode(65 + i); // A, B, C, D
                return (
                  <label 
                    key={opt.id} 
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-orange-600 bg-orange-50/50 shadow-sm' 
                        : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name={currentQuestion.id} 
                      className="sr-only" 
                      onChange={() => handleSelect(opt.id)}
                      checked={isSelected}
                    />
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isSelected ? 'border-orange-600 bg-orange-600' : 'border-slate-300'
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1 flex items-start gap-3">
                      <span className={`font-black shrink-0 ${isSelected ? 'text-orange-700' : 'text-slate-400'}`}>{letter}.</span>
                      <span className={`font-semibold text-[15px] leading-relaxed ${isSelected ? 'text-orange-900' : 'text-slate-700'}`}>
                        {opt.text}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Context (Only if available) */}
        {(currentQuestion.context_text || currentQuestion.audio_url) && (
          <div className="w-full md:w-[45%] h-1/2 md:h-full bg-[#F8FAFC] overflow-y-auto border-b md:border-b-0 md:border-l border-slate-200">
            <div className="p-10">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="w-8 h-8 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center">
                  <IconFlag size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">
                    {currentQuestion.section_type === 'listening' ? "Listening Section" : "Reading Passage"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {currentQuestion.section_type === 'listening' 
                      ? "Listen to the audio carefully to answer the question."
                      : "Read the text carefully to answer the question."}
                  </p>
                </div>
              </div>
              
              {currentQuestion.audio_url && (
                <div className="mb-6">
                  <audio 
                    controls 
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-full rounded-lg" 
                    key={currentQuestion.audio_url}
                  >
                    <source src={currentQuestion.audio_url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {currentQuestion.context_text && (
                <div className="prose prose-slate prose-p:leading-loose prose-p:text-[15px] text-slate-700 font-medium max-w-none">
                  {currentQuestion.context_text.split('\n').map((para: string, i: number) => (
                    <p key={i} className="mb-4">{para}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Bar */}
      <footer className="h-20 bg-white border-t border-slate-200 flex items-center justify-between px-8 shrink-0">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
        >
          <IconChevronLeft size={20} />
          السابق
        </button>
        
        {/* Progress dots (3 dots) */}
        <div className="hidden md:flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400">السؤال {currentIndex + 1}</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${currentIndex > 0 ? 'bg-orange-300' : 'bg-slate-200'}`} />
            <div className="w-3 h-3 rounded-full bg-orange-600 ring-4 ring-orange-50" />
            <div className={`w-2 h-2 rounded-full ${currentIndex < questions.length - 1 ? 'bg-orange-300' : 'bg-slate-200'}`} />
          </div>
        </div>

        <button
          onClick={currentIndex === questions.length - 1 ? handleFinish : handleNext}
          disabled={!answers[currentQuestion.id]}
          className="flex items-center gap-2 px-8 py-3 rounded-lg font-black text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-orange-600"
        >
          {currentIndex === questions.length - 1 ? "إنهاء الاختبار" : "التالي"}
          {currentIndex !== questions.length - 1 && <IconChevronRight size={20} />}
        </button>
      </footer>
    </div>
  );
}
