// ============================================
// أنواع البيانات المشتركة — منصة النخبة
// ملاحظة: هذه الأنواع تطابق مخطط قاعدة بيانات Supabase
// المقترح في ملف مواصفات المشروع (نسخة Multi-tenant)،
// لتسهيل الربط لاحقاً. حقل centerId موجود تمهيداً لذلك
// حتى لو لم يُستخدم فعلياً في الفلترة بعد (بيانات وهمية = مركز واحد).
// ============================================

export type AccessType = "free" | "paid";

export type Subject = {
  id: number;
  centerId: string;
  name: string;
  color: string;
  icon: string; // اسم أيقونة Tabler بدون البادئة "Icon"
};

export type Profile = {
  id: string;
  centerId: string;
  fullName: string;
  role: "student" | "center_admin" | "super_admin";
  level: string; // A+, A, B+...
  streakDays: number;
  avatarInitials: string;
};

export type StudyTask = {
  id: string;
  centerId: string;
  subjectId: number;
  title: string;
  time: string; // "09:00"
  day: number; // 0 = الأحد ... 4 = الخميس
  priority: "high" | "medium" | "low";
  isDone: boolean;
};

export type LessonStatus = "" | "new" | "done";

export type Lesson = {
  id: string;
  centerId: string;
  title: string;
  subjectId: number;
  teacherName: string;
  durationLabel: string; // "24:30"
  progressPercent: number;
  status: LessonStatus;
  accessType: AccessType;
  price: number; // 0 إذا مجاني
};

export type ExamStatus = "new" | "done" | "weak";

export type ExamSummary = {
  id: string;
  centerId: string;
  name: string;
  subjectId: number;
  questionsCount: number;
  timeMinutes: number;
  bestScore: number; // 0 إذا لم يُحل
  status: ExamStatus;
  accessType: AccessType;
};

export type ExamQuestion = {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type LibraryFileType = "pdf" | "video" | "image" | "summary";

export type LibraryFile = {
  id: string;
  centerId: string;
  title: string;
  type: LibraryFileType;
  subjectId: number;
  sizeLabel: string;
  dateLabel: string;
  isNew: boolean;
  accessType: AccessType;
  price: number;
};

export type StudentSubscription = {
  studentId: string;
  status: "active" | "expired" | "pending" | "none";
  planName: string | null;
  expiresAt: string | null; // ISO date
};
