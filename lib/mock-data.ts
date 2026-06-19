// ============================================================
// بيانات وهمية — منصة فلو
// ستُستبدل لاحقاً باستدعاءات Supabase
// ============================================================

import type {
  Subject, Profile, StudyTask, Lesson,
  ExamSummary, ExamQuestion, LibraryFile, StudentSubscription,
} from "./types";

export const MOCK_CENTER_ID = "center-flow-demo";

export const CURRENT_USER: Profile = {
  id: "mock-student-1",
  centerId: MOCK_CENTER_ID,
  fullName: "خالد العمري",
  role: "student",
  level: "A+",
  streakDays: 18,
  avatarInitials: "خ.ع",
};

export const CURRENT_SUBSCRIPTION: StudentSubscription = {
  studentId: CURRENT_USER.id,
  status: "none",
  planName: null,
  expiresAt: null,
};

export const SUBJECTS: Subject[] = [
  { id: 0, centerId: MOCK_CENTER_ID, name: "رياضيات", color: "#6C63FF", icon: "MathFunction" },
  { id: 1, centerId: MOCK_CENTER_ID, name: "علوم",    color: "#00D4AA", icon: "Flask" },
  { id: 2, centerId: MOCK_CENTER_ID, name: "عربي",    color: "#FFB347", icon: "Book" },
  { id: 3, centerId: MOCK_CENTER_ID, name: "إنجليزي", color: "#4A9EFF", icon: "Language" },
  { id: 4, centerId: MOCK_CENTER_ID, name: "فيزياء",  color: "#FF6B6B", icon: "Bolt" },
  { id: 5, centerId: MOCK_CENTER_ID, name: "أحياء",   color: "#00D4AA", icon: "Dna" },
];

export const STUDY_TASKS: StudyTask[] = [
  { id: "t1", centerId: MOCK_CENTER_ID, subjectId: 0, title: "مراجعة درس التفاضل",   time: "09:00", day: 3, priority: "high",   isDone: true },
  { id: "t2", centerId: MOCK_CENTER_ID, subjectId: 1, title: "حل 20 سؤال كيمياء",   time: "11:00", day: 3, priority: "medium", isDone: true },
  { id: "t3", centerId: MOCK_CENTER_ID, subjectId: 4, title: "قوانين نيوتن — فيزياء",time: "14:00", day: 3, priority: "high",   isDone: false },
  { id: "t4", centerId: MOCK_CENTER_ID, subjectId: 2, title: "تمارين النحو — عربي",  time: "16:00", day: 3, priority: "medium", isDone: false },
  { id: "t5", centerId: MOCK_CENTER_ID, subjectId: 3, title: "Grammar Unit 5",        time: "18:00", day: 3, priority: "low",    isDone: false },
];

export const METRICS = {
  avgScore: 86,
  completedLessons: 136,
  totalLessons: 200,
  studyHours: 42,
  attendance: 94,
};

export const LESSONS: Lesson[] = [
  { id: "l1", centerId: MOCK_CENTER_ID, title: "التفاضل والتكامل — المقدمة والمفاهيم الأساسية", subjectId: 0, teacherName: "أ. محمد الزهراني",  durationLabel: "24:30", progressPercent: 100, status: "done", accessType: "free", price: 0 },
  { id: "l2", centerId: MOCK_CENTER_ID, title: "المعادلات التفاضلية من الدرجة الأولى",          subjectId: 0, teacherName: "أ. محمد الزهراني",  durationLabel: "31:15", progressPercent: 60,  status: "",     accessType: "paid", price: 39 },
  { id: "l3", centerId: MOCK_CENTER_ID, title: "التفاعلات الكيميائية وأنواعها",                  subjectId: 1, teacherName: "د. سارة القحطاني", durationLabel: "18:40", progressPercent: 0,   status: "new",  accessType: "free", price: 0 },
  { id: "l4", centerId: MOCK_CENTER_ID, title: "الجدول الدوري والعناصر الانتقالية",              subjectId: 1, teacherName: "د. سارة القحطاني", durationLabel: "22:10", progressPercent: 35,  status: "",     accessType: "paid", price: 39 },
  { id: "l5", centerId: MOCK_CENTER_ID, title: "البلاغة: التشبيه والاستعارة",                    subjectId: 2, teacherName: "أ. فهد العتيبي",   durationLabel: "19:50", progressPercent: 100, status: "done", accessType: "free", price: 0 },
  { id: "l6", centerId: MOCK_CENTER_ID, title: "النحو: الجملة الفعلية والاسمية",                 subjectId: 2, teacherName: "أ. فهد العتيبي",   durationLabel: "26:05", progressPercent: 10,  status: "new",  accessType: "paid", price: 29 },
];

export const EXAMS: ExamSummary[] = [
  { id: "e1", centerId: MOCK_CENTER_ID, name: "اختبار الرياضيات الشامل",   subjectId: 0, questionsCount: 10, timeMinutes: 15, bestScore: 88, status: "done", accessType: "free" },
  { id: "e2", centerId: MOCK_CENTER_ID, name: "اختبار الكيمياء — الوحدة 3", subjectId: 1, questionsCount: 10, timeMinutes: 12, bestScore: 0,  status: "new",  accessType: "free" },
  { id: "e3", centerId: MOCK_CENTER_ID, name: "قواعد النحو المتقدمة",       subjectId: 2, questionsCount: 10, timeMinutes: 10, bestScore: 54, status: "weak", accessType: "paid" },
  { id: "e4", centerId: MOCK_CENTER_ID, name: "Reading Comprehension",       subjectId: 3, questionsCount: 10, timeMinutes: 14, bestScore: 91, status: "done", accessType: "free" },
  { id: "e5", centerId: MOCK_CENTER_ID, name: "قوانين نيوتن للحركة",        subjectId: 4, questionsCount: 10, timeMinutes: 12, bestScore: 42, status: "weak", accessType: "paid" },
  { id: "e6", centerId: MOCK_CENTER_ID, name: "اختبار الخلية والأنسجة",     subjectId: 5, questionsCount: 10, timeMinutes: 13, bestScore: 0,  status: "new",  accessType: "free" },
];

export const EXAM_QUESTIONS_BANK: ExamQuestion[] = [
  { id: "q1",  questionText: "ما هو ناتج العملية الحسابية التالية: 24 ÷ 4 + 6 ؟",                                       options: ["10","12","8","14"],                                                correctIndex: 1, explanation: "حسب ترتيب العمليات: القسمة أولاً (24÷4=6) ثم الجمع (6+6=12)." },
  { id: "q2",  questionText: "أي من العناصر التالية يُعتبر غازاً نبيلاً؟",                                              options: ["الصوديوم","الكلور","الهيليوم","الحديد"],                           correctIndex: 2, explanation: "الهيليوم من الغازات النبيلة لأنه يمتلك مستوى طاقة خارجي مكتمل." },
  { id: "q3",  questionText: "ما هو جمع كلمة «كتاب» في اللغة العربية؟",                                                  options: ["كتب","كتابون","كتابات","كتيبات"],                                 correctIndex: 0, explanation: "جمع التكسير لكلمة «كتاب» هو «كتب»." },
  { id: "q4",  questionText: "Choose the correct synonym for \"Enormous\":",                                               options: ["Tiny","Huge","Quiet","Fast"],                                      correctIndex: 1, explanation: "كلمة Enormous تعني ضخم جداً، وأقرب كلمة بمعنى مشابه هي Huge." },
  { id: "q5",  questionText: "وفقاً لقانون نيوتن الثاني، القوة تساوي:",                                                  options: ["الكتلة ÷ التسارع","الكتلة × التسارع","الكتلة × السرعة","التسارع ÷ الكتلة"], correctIndex: 1, explanation: "قانون نيوتن الثاني: القوة = الكتلة × التسارع (F=ma)." },
  { id: "q6",  questionText: "ما هي وحدة قياس الجهد الكهربائي؟",                                                         options: ["أمبير","أوم","فولت","واط"],                                        correctIndex: 2, explanation: "الفولت هو وحدة قياس الجهد الكهربائي." },
  { id: "q7",  questionText: "أي من الخيارات التالية يمثل عدداً أولياً؟",                                                options: ["15","21","17","27"],                                               correctIndex: 2, explanation: "العدد 17 لا يقبل القسمة إلا على 1 ونفسه." },
  { id: "q8",  questionText: "الخلية العصبية (Neuron) تتكون أساساً من جسم الخلية، المحور، و:",                           options: ["الميتوكوندريا فقط","التشعبات (Dendrites)","الكلوروبلاست","جدار الخلية"], correctIndex: 1, explanation: "التشعبات (Dendrites) هي امتدادات تستقبل الإشارات." },
  { id: "q9",  questionText: "ما هو ناظم القافية (الروي) في علم العروض؟",                                                options: ["آخر حرف في الشطر الأول فقط","الحرف الذي تُبنى عليه القصيدة","أول حرف من البيت","عدد التفعيلات"], correctIndex: 1, explanation: "الروي هو الحرف الذي تُبنى عليه القصيدة." },
  { id: "q10", questionText: "Which word is a verb in the sentence: \"She quickly finished her homework\"?",               options: ["Quickly","Finished","Her","Homework"],                             correctIndex: 1, explanation: "كلمة Finished هي الفعل في الجملة." },
];

export const LIBRARY_FILES: LibraryFile[] = [
  { id: "f1", centerId: MOCK_CENTER_ID, title: "ملخص قوانين الفيزياء — الحركة",  type: "pdf",     subjectId: 4, sizeLabel: "2.4 MB", dateLabel: "10 يونيو 2026", isNew: true,  accessType: "free", price: 0 },
  { id: "f2", centerId: MOCK_CENTER_ID, title: "شرح مرئي: التفاضل والتكامل",      type: "video",   subjectId: 0, sizeLabel: "185 MB", dateLabel: "8 يونيو 2026",  isNew: false, accessType: "paid", price: 19 },
  { id: "f3", centerId: MOCK_CENTER_ID, title: "خريطة ذهنية — البلاغة العربية",   type: "image",   subjectId: 2, sizeLabel: "1.1 MB", dateLabel: "5 يونيو 2026",  isNew: false, accessType: "free", price: 0 },
  { id: "f4", centerId: MOCK_CENTER_ID, title: "ملخص الجدول الدوري الشامل",        type: "summary", subjectId: 1, sizeLabel: "850 KB", dateLabel: "12 يونيو 2026", isNew: true,  accessType: "paid", price: 9 },
];

export const NEXT_EXAM = {
  title: "اختبار الرياضيات الشامل",
  targetDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000).toISOString(),
};

export const WEEK_DAYS = [
  { name: "الأحد",     count: 4, sub: "مهام" },
  { name: "الإثنين",  count: 3, sub: "مهام" },
  { name: "الثلاثاء", count: 5, sub: "مهام" },
  { name: "الأربعاء", count: 2, sub: "مهام", isToday: true },
  { name: "الخميس",   count: 1, sub: "مهمة" },
];

// ══════════════════════════════════════════════════════════════
// المسارات والأقسام والمهارات
// ══════════════════════════════════════════════════════════════

export type SkillStatus = "strong" | "average" | "weak" | "not_started";

export interface FlowSkill {
  id: string;
  name: string;
  masteryScore: number;
  status: SkillStatus;
  remedialVideoUrl?: string;
}

export interface FlowSection {
  id: string;
  name: string;
  skills: FlowSkill[];
}

export interface FlowTrack {
  id: string;
  name: string;
  color: string;
  gradient: string;
  icon: string;
  sections: FlowSection[];
}

export interface SkillQuestion extends ExamQuestion {
  skillId: string;
  skillName: string;
}

export const FLOW_TRACKS: FlowTrack[] = [
  {
    id: "qudrat-komi",
    name: "القدرات (كمي)",
    color: "#6366f1",
    gradient: "from-indigo-500 to-violet-600",
    icon: "📐",
    sections: [
      {
        id: "algebra", name: "جبر",
        skills: [
          { id: "sk-alg-1", name: "المعادلات الخطية",       masteryScore: 72, status: "average" },
          { id: "sk-alg-2", name: "المتباينات",              masteryScore: 55, status: "average" },
          { id: "sk-alg-3", name: "الدوال والعلاقات",        masteryScore: 40, status: "weak"    },
          { id: "sk-alg-4", name: "الأنماط والمتتاليات",     masteryScore: 80, status: "strong"  },
        ],
      },
      {
        id: "geometry", name: "هندسة",
        skills: [
          { id: "sk-geo-1", name: "المساحات والمحيطات",      masteryScore: 85, status: "strong"  },
          { id: "sk-geo-2", name: "الزوايا والمثلثات",        masteryScore: 60, status: "average" },
          { id: "sk-geo-3", name: "الدائرة وخواصها",          masteryScore: 45, status: "weak"    },
          { id: "sk-geo-4", name: "الأشكال الفضائية",         masteryScore: 30, status: "weak"    },
        ],
      },
      {
        id: "statistics", name: "إحصاء واحتمالات",
        skills: [
          { id: "sk-stat-1", name: "الوسط الحسابي والوسيط",  masteryScore: 78, status: "average" },
          { id: "sk-stat-2", name: "الاحتمالات الأساسية",     masteryScore: 35, status: "weak"    },
          { id: "sk-stat-3", name: "قراءة الجداول والرسوم",   masteryScore: 90, status: "strong"  },
        ],
      },
      {
        id: "word-problems", name: "مسائل لفظية",
        skills: [
          { id: "sk-wp-1", name: "مسائل السرعة والمسافة",    masteryScore: 50, status: "average" },
          { id: "sk-wp-2", name: "مسائل الخلائط والنسب",     masteryScore: 30, status: "weak"    },
          { id: "sk-wp-3", name: "مسائل الربح والخسارة",      masteryScore: 65, status: "average" },
        ],
      },
      {
        id: "comparisons", name: "مقارنات كمية",
        skills: [
          { id: "sk-cmp-1", name: "مقارنة الكميتين",          masteryScore: 82, status: "strong"  },
          { id: "sk-cmp-2", name: "مقارنة العبارات الجبرية",  masteryScore: 55, status: "average" },
        ],
      },
    ],
  },
  {
    id: "qudrat-lafzi",
    name: "القدرات (لفظي)",
    color: "#8b5cf6",
    gradient: "from-purple-500 to-fuchsia-600",
    icon: "📖",
    sections: [
      {
        id: "odd-word", name: "المفردة الشاذة",
        skills: [
          { id: "sk-ow-1", name: "تصنيف الكلمات بالمعنى",    masteryScore: 70, status: "average" },
          { id: "sk-ow-2", name: "العلاقة المفهومية",          masteryScore: 55, status: "average" },
        ],
      },
      {
        id: "reading", name: "استيعاب المقروء",
        skills: [
          { id: "sk-rd-1", name: "الفكرة الرئيسية",            masteryScore: 80, status: "strong"  },
          { id: "sk-rd-2", name: "الاستنتاج والتحليل",          masteryScore: 38, status: "weak"    },
          { id: "sk-rd-3", name: "معنى الكلمة من السياق",      masteryScore: 60, status: "average" },
        ],
      },
      {
        id: "completion", name: "إكمال الجمل",
        skills: [
          { id: "sk-cmp-lf-1", name: "الترابط المنطقي للجملة", masteryScore: 65, status: "average" },
          { id: "sk-cmp-lf-2", name: "الثغرات المفردية",        masteryScore: 75, status: "average" },
        ],
      },
      {
        id: "context-error", name: "الخطأ السياقي",
        skills: [
          { id: "sk-ce-1", name: "اكتشاف التناقض",             masteryScore: 42, status: "weak"    },
          { id: "sk-ce-2", name: "الكلمة غير المناسبة",         masteryScore: 58, status: "average" },
        ],
      },
      {
        id: "analogy", name: "التناظر اللفظي",
        skills: [
          { id: "sk-an-1", name: "علاقة الجزء بالكل",           masteryScore: 50, status: "average" },
          { id: "sk-an-2", name: "علاقة السبب بالنتيجة",        masteryScore: 33, status: "weak"    },
          { id: "sk-an-3", name: "علاقة الضد والمرادف",         masteryScore: 85, status: "strong"  },
        ],
      },
    ],
  },
  {
    id: "nafis",
    name: "نافس",
    color: "#ef4444",
    gradient: "from-red-500 to-rose-600",
    icon: "🏆",
    sections: [
      {
        id: "nafis-math", name: "رياضيات نافس",
        skills: [
          { id: "sk-nm-1", name: "الأعداد والعمليات",          masteryScore: 75, status: "average" },
          { id: "sk-nm-2", name: "الكسور والنسب المئوية",       masteryScore: 60, status: "average" },
          { id: "sk-nm-3", name: "الجبر الأساسي",               masteryScore: 45, status: "weak"    },
        ],
      },
      {
        id: "nafis-science", name: "علوم نافس",
        skills: [
          { id: "sk-ns-1", name: "الفيزياء الأساسية",           masteryScore: 50, status: "average" },
          { id: "sk-ns-2", name: "الكيمياء الأساسية",            masteryScore: 40, status: "weak"    },
        ],
      },
      {
        id: "nafis-arabic", name: "لغة عربية نافس",
        skills: [
          { id: "sk-na-1", name: "القواعد النحوية",              masteryScore: 70, status: "average" },
          { id: "sk-na-2", name: "الفهم والاستيعاب",             masteryScore: 65, status: "average" },
        ],
      },
    ],
  },
  {
    id: "tasis",
    name: "قدرات تأسيس",
    color: "#f59e0b",
    gradient: "from-amber-500 to-orange-500",
    icon: "🔢",
    sections: [
      {
        id: "tasis-komi", name: "تأسيس كمي",
        skills: [
          { id: "sk-tk-1", name: "العمليات الأساسية",            masteryScore: 90, status: "strong"  },
          { id: "sk-tk-2", name: "الكسور والأعداد العشرية",      masteryScore: 75, status: "average" },
          { id: "sk-tk-3", name: "النسب والتناسب",               masteryScore: 55, status: "average" },
        ],
      },
      {
        id: "tasis-lafzi", name: "تأسيس لفظي",
        skills: [
          { id: "sk-tl-1", name: "المفردات الأساسية",            masteryScore: 80, status: "strong"  },
          { id: "sk-tl-2", name: "الفهم القرائي البسيط",          masteryScore: 68, status: "average" },
        ],
      },
    ],
  },
];


export const TRACK_EXAMS: Array<{
  id: string; trackId: string; sectionId: string;
  name: string; timeMinutes: number; accessType: "free" | "paid";
  questions: SkillQuestion[];
}> = [];

export const STUDENT_SKILL_PROGRESS = {
  totalSkills: 32,
  masteredSkills: 12,
  avgMastery: 61,
  weakSkillsCount: 8,
  topWeakSkills: [
    { id: "functions",   name: "الدوال",            track: "القدرات (كمي)",   score: 40, trackColor: "#6366f1" },
    { id: "inference",   name: "الاستنتاج",          track: "القدرات (لفظي)", score: 38, trackColor: "#8b5cf6" },
    { id: "probability", name: "الاحتمالات",          track: "القدرات (كمي)",  score: 35, trackColor: "#6366f1" },
    { id: "cause-eff",   name: "سبب-نتيجة",          track: "القدرات (لفظي)", score: 33, trackColor: "#8b5cf6" },
    { id: "mixtures",    name: "مسائل الخلائط",       track: "القدرات (كمي)",  score: 30, trackColor: "#6366f1" },
  ],
};
