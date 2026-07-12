// ============================================================
// بيانات وهمية — الأوس الماسية
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
  { id: "q1",  questionText: "ما هو ناتج العملية الحسابية التالية: 24 ÷ 4 + 6 ؟",                                       options: ["10","12","8","14"],                                                explanation: "حسب ترتيب العمليات: القسمة أولاً (24÷4=6) ثم الجمع (6+6=12)." },
  { id: "q2",  questionText: "أي من العناصر التالية يُعتبر غازاً نبيلاً؟",                                              options: ["الصوديوم","الكلور","الهيليوم","الحديد"],                           explanation: "الهيليوم من الغازات النبيلة لأنه يمتلك مستوى طاقة خارجي مكتمل." },
  { id: "q3",  questionText: "ما هو جمع كلمة «كتاب» في اللغة العربية؟",                                                  options: ["كتب","كتابون","كتابات","كتيبات"],                                 explanation: "جمع التكسير لكلمة «كتاب» هو «كتب»." },
  { id: "q4",  questionText: "Choose the correct synonym for \"Enormous\":",                                               options: ["Tiny","Huge","Quiet","Fast"],                                      explanation: "كلمة Enormous تعني ضخم جداً، وأقرب كلمة بمعنى مشابه هي Huge." },
  { id: "q5",  questionText: "وفقاً لقانون نيوتن الثاني، القوة تساوي:",                                                  options: ["الكتلة ÷ التسارع","الكتلة × التسارع","الكتلة × السرعة","التسارع ÷ الكتلة"], explanation: "قانون نيوتن الثاني: القوة = الكتلة × التسارع (F=ma)." },
  { id: "q6",  questionText: "ما هي وحدة قياس الجهد الكهربائي؟",                                                         options: ["أمبير","أوم","فولت","واط"],                                        explanation: "الفولت هو وحدة قياس الجهد الكهربائي." },
  { id: "q7",  questionText: "أي من الخيارات التالية يمثل عدداً أولياً؟",                                                options: ["15","21","17","27"],                                               explanation: "العدد 17 لا يقبل القسمة إلا على 1 ونفسه." },
  { id: "q8",  questionText: "الخلية العصبية (Neuron) تتكون أساساً من جسم الخلية، المحور، و:",                           options: ["الميتوكوندريا فقط","التشعبات (Dendrites)","الكلوروبلاست","جدار الخلية"], explanation: "التشعبات (Dendrites) هي امتدادات تستقبل الإشارات." },
  { id: "q9",  questionText: "ما هو ناظم القافية (الروي) في علم العروض؟",                                                options: ["آخر حرف في الشطر الأول فقط","الحرف الذي تُبنى عليه القصيدة","أول حرف من البيت","عدد التفعيلات"], explanation: "الروي هو الحرف الذي تُبنى عليه القصيدة." },
  { id: "q10", questionText: "Which word is a verb in the sentence: \"She quickly finished her homework\"?",               options: ["Quickly","Finished","Her","Homework"],                             explanation: "كلمة Finished هي الفعل في الجملة." },
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

export type FlowSkill = {
  id: string;
  name: string;
  masteryScore?: number;
  status: "strong" | "average" | "weak" | "not_started";
  remedialVideoUrl?: string;
  lessonId?: string; // Strict mapping to a specific lesson
};

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
  correctIndex?: number;
  /** Parallel array to options: maps each option's display index to its DB UUID */
  optionIds?: string[];
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
        id: "algebra", name: "الجبر",
        skills: [
          { id: "linear-eq",   name: "المعادلات الخطية",     masteryScore: 85, status: "strong" },
          { id: "quadratic",   name: "المعادلات التربيعية",  masteryScore: 62, status: "average" },
          { id: "functions",   name: "الدوال",               masteryScore: 40, status: "weak", remedialVideoUrl: "#" },
          { id: "sequences",   name: "المتتاليات",            masteryScore: 0,  status: "not_started" },
        ],
      },
      {
        id: "geometry", name: "الهندسة",
        skills: [
          { id: "areas",       name: "المساحات والمحيطات",   masteryScore: 90, status: "strong" },
          { id: "angles",      name: "الزوايا والمثلثات",    masteryScore: 45, status: "weak", remedialVideoUrl: "#" },
          { id: "coordinates", name: "الإحداثيات",           masteryScore: 70, status: "average" },
        ],
      },
      {
        id: "statistics", name: "الإحصاء",
        skills: [
          { id: "mean",        name: "الوسط الحسابي",        masteryScore: 80, status: "strong" },
          { id: "probability", name: "الاحتمالات",            masteryScore: 35, status: "weak", remedialVideoUrl: "#" },
          { id: "charts",      name: "قراءة الرسوم البيانية",masteryScore: 0,  status: "not_started" },
        ],
      },
      {
        id: "word-problems", name: "المسائل اللفظية",
        skills: [
          { id: "rate",        name: "مسائل الإيقاع والزمن", masteryScore: 55, status: "average" },
          { id: "mixtures",    name: "مسائل الخلائط",        masteryScore: 30, status: "weak", remedialVideoUrl: "#" },
        ],
      },
      {
        id: "comparisons", name: "المقارنات الكمية",
        skills: [
          { id: "compare-a",   name: "مقارنة الكميات",       masteryScore: 75, status: "average" },
          { id: "compare-b",   name: "العلاقة بين كميتين",   masteryScore: 0,  status: "not_started" },
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
        id: "odd-word", name: "مفردة شاذة",
        skills: [
          { id: "synonym",     name: "المترادفات",             masteryScore: 88, status: "strong" },
          { id: "antonym",     name: "المتضادات",              masteryScore: 50, status: "average" },
        ],
      },
      {
        id: "reading", name: "استيعاب المقروء",
        skills: [
          { id: "main-idea",   name: "الفكرة الرئيسية",       masteryScore: 72, status: "average" },
          { id: "inference",   name: "الاستنتاج",              masteryScore: 38, status: "weak", remedialVideoUrl: "#" },
          { id: "detail",      name: "التفاصيل الداعمة",      masteryScore: 65, status: "average" },
        ],
      },
      {
        id: "completion", name: "إكمال الجمل",
        skills: [
          { id: "context",     name: "السياق اللغوي",          masteryScore: 82, status: "strong" },
          { id: "structure",   name: "البنية النحوية",         masteryScore: 44, status: "weak", remedialVideoUrl: "#" },
        ],
      },
      {
        id: "context-error", name: "الخطأ السياقي",
        skills: [
          { id: "logic-err",   name: "الخطأ المنطقي",         masteryScore: 60, status: "average" },
          { id: "gram-err",    name: "الخطأ النحوي",          masteryScore: 0,  status: "not_started" },
        ],
      },
      {
        id: "analogy", name: "التناظر اللفظي",
        skills: [
          { id: "part-whole",  name: "جزء-كل",                masteryScore: 78, status: "average" },
          { id: "cause-eff",   name: "سبب-نتيجة",             masteryScore: 33, status: "weak", remedialVideoUrl: "#" },
        ],
      },
    ],
  },
  // ── نافس ───────────────────────────────────────────────────
  {
    id: "nafis",
    name: "نافس",
    color: "#ef4444",
    gradient: "from-red-500 to-rose-600",
    icon: "🏆",
    sections: [
      {
        id: "nafis-math", name: "رياضيات",
        skills: [
          { id: "nafis-algebra",  name: "الجبر والمعادلات",   masteryScore: 68, status: "average" },
          { id: "nafis-geom",    name: "الهندسة",               masteryScore: 50, status: "average" },
          { id: "nafis-stats",   name: "الإحصاء",              masteryScore: 35, status: "weak", remedialVideoUrl: "#" },
        ],
      },
      {
        id: "nafis-science", name: "علوم",
        skills: [
          { id: "nafis-physics", name: "الفيزياء الأساسية",    masteryScore: 72, status: "average" },
          { id: "nafis-chem",   name: "الكيمياء الأساسية",    masteryScore: 55, status: "average" },
          { id: "nafis-bio",    name: "الأحياء",               masteryScore: 0,  status: "not_started" },
        ],
      },
      {
        id: "nafis-arabic", name: "لغة عربية",
        skills: [
          { id: "nafis-vocab",   name: "المفردات",              masteryScore: 80, status: "strong" },
          { id: "nafis-grammar",name: "النحو والصرف",         masteryScore: 42, status: "weak", remedialVideoUrl: "#" },
          { id: "nafis-comprehension",name: "الفهم والاستيعاب",   masteryScore: 60, status: "average" },
        ],
      },
    ],
  },
  // ── نافس ──────────────────────────────────────────────────
  {
    id: "nafis",
    name: "نافس",
    color: "#ef4444",
    gradient: "from-red-500 to-rose-600",
    icon: "🏆",
    sections: [
      {
        id: "nafis-math", name: "رياضيات",
        skills: [
          { id: "nafis-algebra",       name: "الجبر والمعادلات",     masteryScore: 68, status: "average" },
          { id: "nafis-geom",          name: "الهندسة",               masteryScore: 50, status: "average" },
          { id: "nafis-stats",         name: "الإحصاء",              masteryScore: 35, status: "weak", remedialVideoUrl: "#" },
        ],
      },
      {
        id: "nafis-science", name: "علوم",
        skills: [
          { id: "nafis-physics",       name: "الفيزياء الأساسية",    masteryScore: 72, status: "average" },
          { id: "nafis-chem",          name: "الكيمياء الأساسية",    masteryScore: 55, status: "average" },
          { id: "nafis-bio",           name: "الأحياء",               masteryScore: 0,  status: "not_started" },
        ],
      },
      {
        id: "nafis-arabic", name: "لغة عربية",
        skills: [
          { id: "nafis-vocab",         name: "المفردات",              masteryScore: 80, status: "strong" },
          { id: "nafis-grammar",       name: "النحو والصرف",         masteryScore: 42, status: "weak", remedialVideoUrl: "#" },
          { id: "nafis-comprehension", name: "الفهم والاستيعاب",     masteryScore: 60, status: "average" },
        ],
      },
    ],
  },
  {
    id: "tasis-komi",

    name: "قدرات تأسيس (كمي)",
    color: "#f59e0b",
    gradient: "from-amber-500 to-orange-500",
    icon: "🔢",
    sections: [
      {
        id: "basic-ops", name: "العمليات الأساسية",
        skills: [
          { id: "add-sub",     name: "الجمع والطرح",          masteryScore: 95, status: "strong" },
          { id: "mul-div",     name: "الضرب والقسمة",         masteryScore: 90, status: "strong" },
          { id: "fractions",   name: "الكسور",                masteryScore: 58, status: "average" },
        ],
      },
      {
        id: "basic-geom", name: "الهندسة التأسيسية",
        skills: [
          { id: "shapes",      name: "الأشكال الهندسية",      masteryScore: 82, status: "strong" },
          { id: "perimeter",   name: "المحيط والمساحة",       masteryScore: 47, status: "weak", remedialVideoUrl: "#" },
        ],
      },
    ],
  },
  {
    id: "tasis-lafzi",
    name: "قدرات تأسيس (لفظي)",
    color: "#10b981",
    gradient: "from-emerald-500 to-teal-600",
    icon: "✍️",
    sections: [
      {
        id: "vocab-basic", name: "المفردات الأساسية",
        skills: [
          { id: "common-words",name: "الكلمات الشائعة",       masteryScore: 91, status: "strong" },
          { id: "roots",        name: "جذور الكلمات",          masteryScore: 56, status: "average" },
        ],
      },
      {
        id: "grammar-basic", name: "القواعد الأساسية",
        skills: [
          { id: "sentence-type",name: "أنواع الجمل",          masteryScore: 75, status: "average" },
          { id: "punctuation",  name: "علامات الترقيم",        masteryScore: 0,  status: "not_started" },
        ],
      },
    ],
  },
];

export const TRACK_EXAMS: Array<{
  id: string; trackId: string; sectionId: string;
  name: string; timeMinutes: number; accessType: "free" | "paid";
  questions: SkillQuestion[];
}> = [
  {
    id: "te1", trackId: "qudrat-komi", sectionId: "algebra",
    name: "اختبار الجبر الشامل", timeMinutes: 15, accessType: "free",
    questions: [
      { id: "tq1", skillId: "linear-eq",  skillName: "المعادلات الخطية",    questionText: "حل المعادلة: 2x + 6 = 14",                                    options: ["x=3","x=4","x=5","x=6"],       explanation: "2x = 8، إذن x = 4" },
      { id: "tq2", skillId: "linear-eq",  skillName: "المعادلات الخطية",    questionText: "إذا كان 3x - 9 = 0، فإن x يساوي:",                          options: ["1","2","3","4"],               explanation: "3x = 9، إذن x = 3" },
      { id: "tq3", skillId: "quadratic",  skillName: "المعادلات التربيعية", questionText: "حلول المعادلة x² - 5x + 6 = 0 هي:",                         options: ["x=1,6","x=2,3","x=2,4","x=1,5"], explanation: "(x-2)(x-3)=0" },
      { id: "tq4", skillId: "functions",  skillName: "الدوال",              questionText: "إذا كانت f(x) = 2x + 1، فإن f(3) يساوي:",                   options: ["5","6","7","8"],               explanation: "f(3) = 2×3+1 = 7" },
      { id: "tq5", skillId: "sequences",  skillName: "المتتاليات",           questionText: "الحد العاشر في المتتالية الحسابية 2، 5، 8، ...",              options: ["27","29","30","32"],           explanation: "a₁₀ = 2+(9×3) = 29" },
    ],
  },
  {
    id: "te2", trackId: "qudrat-komi", sectionId: "geometry",
    name: "اختبار الهندسة", timeMinutes: 12, accessType: "free",
    questions: [
      { id: "tq6", skillId: "areas",      skillName: "المساحات والمحيطات",  questionText: "مساحة مستطيل طوله 8 وعرضه 5:",                               options: ["26","35","40","45"],           explanation: "المساحة = 8×5 = 40" },
      { id: "tq7", skillId: "angles",     skillName: "الزوايا والمثلثات",   questionText: "مجموع زوايا المثلث يساوي:",                                    options: ["90°","180°","270°","360°"],   explanation: "مجموع زوايا أي مثلث = 180°" },
      { id: "tq8", skillId: "coordinates",skillName: "الإحداثيات",          questionText: "المسافة بين نقطتي (0,0) و (3,4):",                           options: ["3","4","5","7"],               explanation: "المسافة = √(9+16) = 5" },
    ],
  },
  {
    id: "te3", trackId: "qudrat-lafzi", sectionId: "reading",
    name: "اختبار الاستيعاب المقروء", timeMinutes: 15, accessType: "free",
    questions: [
      { id: "tq9",  skillId: "main-idea", skillName: "الفكرة الرئيسية",    questionText: "ما الغرض الرئيسي لمقدمة النص في فقرة استيعاب القراءة؟",      options: ["تقديم تفاصيل ثانوية","استقطاب انتباه القارئ","ذكر الخاتمة","استعراض الأدلة"], explanation: "المقدمة تُعرِّف بالموضوع." },
      { id: "tq10", skillId: "inference", skillName: "الاستنتاج",           questionText: "عندما يقول الكاتب 'بات الجميع صامتاً' يُستنتج أن:",          options: ["الجميع نائمون","حدث شيء مفاجئ","انتهى الاجتماع","الأصوات عالية"], explanation: "الصمت المفاجئ يدل على حدث مستوقف." },
    ],
  },
  {
    id: "te4", trackId: "qudrat-komi", sectionId: "statistics",
    name: "اختبار الإحصاء", timeMinutes: 12, accessType: "free",
    questions: [
      { id: "tq11", skillId: "mean",        skillName: "الوسط الحسابي",     questionText: "الوسط الحسابي للأعداد 4، 6، 8، 10، 12:",                    options: ["8","9","10","11"],             explanation: "المجموع=40، العدد=5، الوسط=8" },
      { id: "tq12", skillId: "probability", skillName: "الاحتمالات",        questionText: "احتمال ظهور 'صورة' عند رمي عملة معدنية مرة واحدة:",          options: ["1/4","1/3","1/2","3/4"],      explanation: "وجهان متكافئان، احتمال كل منهما = 1/2" },
    ],
  },
];

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
