// @ts-nocheck
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type FlowTrack, type SkillQuestion } from "@/lib/mock-data";

// ── Types ────────────────────────────────────────────────────────

export type AdminLesson = {
  id: string;
  title: string;
  videoUrl: string;
  teacherName: string;
  trackId: string;
  sectionId: string;
  durationLabel: string;
  accessType: "free" | "paid";
  price: number;
  status: "new" | "normal" | "completed";
  coverImage?: string;
  commentsEnabled?: boolean;
  durationSeconds?: number;
  progressPercent?: number;
};

export type AdminExam = {
  id: string;
  trackId: string;
  sectionId: string;
  name: string;
  timeMinutes: number;
  accessType: "free" | "paid";
  price: number;
  questions: SkillQuestion[];
};

export type LibraryFile = {
  id: string;
  title: string;
  type: "pdf" | "video" | "image" | "summary";
  category?: "ملازم وتأسيس" | "ملخصات سريعة" | "بنك أسئلة وتجميعات" | "أوراق عمل" | string;
  coverImage?: string;
  pagesCount?: number;
  downloadsCount?: number;
  trackId: string;
  sectionId?: string;
  url: string;
  sizeLabel: string;
  dateLabel: string;
  accessType: "free" | "paid";
  price: number;
};

export type DiscountCode = {
  id: string;
  code: string;
  discountPercent: number;
  uses: number;
  maxUses: number;
  expiryDate: string;
};

export type SubscriptionPrices = {
  monthly: number;
  yearly: number;
};

// ── Course Type ──────────────────────────────────────────────────

export type Course = {
  id: string;
  title: string;             // "دورة القدرات 2026"
  subtitle: string;          // "الدورة الشاملة لاختبار القدرات"
  description: string;       // وصف تفصيلي
  price: number;             // السعر الأصلي
  discountedPrice: number;   // السعر بعد الخصم (0 = مجاني)
  currency: string;          // "ر.س"
  coverGradient: string;     // "from-indigo-500 to-purple-600"
  coverImageUrl?: string;    // "https://..."
  examDate: string;          // "2026-11-01"  تاريخ الاختبار
  trackIds: string[];        // المسارات المضمنة ["qudrat-komi","qudrat-lafzi"]
  features: string[];        // ["200+ درس مصور","3000+ سؤال تدريبي","شرح المهارات الضعيفة"]
  tags: string[];            // ["قدرات","كمي","لفظي"]
  instructorName: string;    // "فريق فلو التعليمي"
  totalHours: string;        // "80 ساعة"
  studentsCount: number;     // 1200
  isActive: boolean;         // هل الدورة مفعّلة على الواجهة
  isFeatured: boolean;       // هل تظهر في الأعلى
  requireWhatsappActivation?: boolean; // هل يتطلب الاشتراك تفعيل من الواتساب
  featuresOverride?: Record<string, boolean>; // الاستثناءات الخاصة بالدورة للميزات الشاملة
  isSimulator?: boolean;     // هل الدورة عبارة عن محاكي مجاني
  createdAt: string;
};

export type EnrolledCourse = {
  id: string;
  title: string;
};

// ── Store Definition ─────────────────────────────────────────────

type PlatformState = {
  // Data
  tracks: FlowTrack[];
  lessons: AdminLesson[];
  exams: AdminExam[];
  files: LibraryFile[];
  discountCodes: DiscountCode[];
  subscriptionPrices: SubscriptionPrices;
  courses: Course[];
  platformSettings: { global_interactive_book: boolean; global_study_plan: boolean; global_library: boolean; } | null;
  
  // User Context
  userRole: string; // 'student' | 'admin' | 'content' | 'super'
  enrolledCourses: EnrolledCourse[];
  enrolledCourseId: string | null;
  isDataLoading: boolean;
  isExamMode: boolean;

  // Actions
  setIsExamMode: (val: boolean) => void;
  setTracks: (tracks: FlowTrack[] | ((prev: FlowTrack[]) => FlowTrack[])) => void;
  setLessons: (lessons: AdminLesson[] | ((prev: AdminLesson[]) => AdminLesson[])) => void;
  setExams: (exams: AdminExam[] | ((prev: AdminExam[]) => AdminExam[])) => void;
  setFiles: (files: LibraryFile[] | ((prev: LibraryFile[]) => LibraryFile[])) => void;
  setDiscountCodes: (updater: DiscountCode[] | ((prev: DiscountCode[]) => DiscountCode[])) => void;
  setSubscriptionPrices: (updater: SubscriptionPrices | ((prev: SubscriptionPrices) => SubscriptionPrices)) => void;
  setPlatformSettings: (settings: { global_interactive_book: boolean; global_study_plan: boolean; global_library: boolean; } | null) => void;
  markLessonAsCompleted: (lessonId: string) => void;
  updateSkillScore: (skillId: string, newScore: number) => void;
  setCourses: (courses: Course[] | ((prev: Course[]) => Course[])) => void;
  setEnrolledCourses: (courses: EnrolledCourse[]) => void;
  setEnrolledCourseId: (id: string | null) => void;
  setIsDataLoading: (loading: boolean) => void;

  applyUserProgress: (skillsProgress: any[], lessonsProgress: any[]) => void;
  updateItemPrice: (type: "lesson" | "exam" | "file", id: string, newPrice: number) => void;

  resetStore: () => void;
  resetCourseData: () => void;
};

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set) => ({
      tracks: [],
      lessons: [],
      exams: [],
      files: [],
      discountCodes: [],
      subscriptionPrices: { monthly: 0, yearly: 0 },
      platformSettings: null,
      courses: [],
      enrolledCourses: [],
      enrolledCourseId: null,
      isDataLoading: true,
      isExamMode: false,

      setIsExamMode: (val) => set({ isExamMode: val }),

      setTracks: (updater) => set((state) => ({
        tracks: typeof updater === "function" ? updater(state.tracks) : updater
      })),

      setLessons: (updater) => set((state) => ({
        lessons: typeof updater === "function" ? updater(state.lessons) : updater
      })),

      setIsDataLoading: (loading) => set({ isDataLoading: loading }),

      setExams: (updater) => set((state) => ({
        exams: typeof updater === "function" ? updater(state.exams) : updater
      })),

      setFiles: (updater) => set((state) => ({
        files: typeof updater === "function" ? updater(state.files) : updater
      })),

      setDiscountCodes: (updater) => set((state) => ({
        discountCodes: typeof updater === "function" ? updater(state.discountCodes) : updater
      })),

      setSubscriptionPrices: (updater) => set((state) => ({
        subscriptionPrices: typeof updater === "function" ? updater(state.subscriptionPrices) : updater
      })),

      setPlatformSettings: (settings) => set({ platformSettings: settings }),

      markLessonAsCompleted: (lessonId) => set((state) => ({
        lessons: state.lessons.map(l => l.id === lessonId ? { ...l, status: "completed" } : l)
      })),

      updateSkillScore: (skillId, newScore, attempted = true) => set((state) => {
        const updatedTracks = state.tracks.map(track => ({
          ...track,
          sections: track.sections.map(section => ({
            ...section,
            skills: section.skills.map(skill => {
              if (skill.id !== skillId) return skill;
              let status: "not_started" | "weak" | "average" | "strong" = "not_started";
              if (attempted) {
                // Skill has been attempted — score 0 = weak, not "not_started"
                if (newScore < 50) status = "weak";
                else if (newScore < 80) status = "average";
                else status = "strong";
              }
              return { ...skill, masteryScore: newScore, status };
            })
          }))
        }));
        return { tracks: updatedTracks };
      }),

      setCourses: (updater) => set((state) => ({
        courses: typeof updater === "function" ? updater(state.courses) : updater
      })),

      setEnrolledCourses: (courses) => set({ enrolledCourses: courses }),
      setEnrolledCourseId: (id) => set({ enrolledCourseId: id }),

      updateItemPrice: (type, id, newPrice) => set((state) => {
        if (type === "lesson") return { lessons: state.lessons.map(l => l.id === id ? { ...l, price: newPrice } : l) };
        if (type === "exam") return { exams: state.exams.map(e => e.id === id ? { ...e, price: newPrice } : e) };
        if (type === "file") return { files: state.files.map(f => f.id === id ? { ...f, price: newPrice } : f) };
        return state;
      }),

      applyUserProgress: (skillsProgress, lessonsProgress) => set((state) => {
        // Build a map: micro_skill_id -> full progress row (includes total_questions_seen)
        const skillsMap = new Map(skillsProgress.map(s => [s.micro_skill_id, s]));
        const lessonsMap = new Map(lessonsProgress.map(l => [l.lesson_id, l]));

        const updatedTracks = state.tracks.map(track => ({
          ...track,
          sections: track.sections.map(section => ({
            ...section,
            skills: section.skills.map(skill => {
              const progressData = skillsMap.get(skill.id);
              const score = progressData?.mastery_score ?? 0;
              // A skill is "not_started" only if there is NO row in skill_progress for it.
              // If a row exists (total_questions_seen > 0), it has been attempted — even if score is 0.
              const hasBeenAttempted = progressData !== undefined && (progressData.total_questions_seen || 0) > 0;
              let status: "not_started" | "weak" | "average" | "strong" = "not_started";
              if (hasBeenAttempted) {
                if (score < 50) status = "weak";
                else if (score < 80) status = "average";
                else status = "strong";
              }
              return { ...skill, masteryScore: score, status };
            })
          }))
        }));

        const updatedLessons = state.lessons.map(lesson => {
          const prog = lessonsMap.get(lesson.id);
          const isDone = prog?.is_completed;
          const pSec = prog ? (prog as any).progress_seconds || 0 : 0;
          const dur = lesson.durationSeconds || 1;
          const percent = Math.min(100, Math.round((pSec / dur) * 100));

          return {
            ...lesson,
            status: isDone ? "completed" : "normal",
            progressPercent: isDone ? 100 : percent
          };
        }) as AdminLesson[];

        return { tracks: updatedTracks, lessons: updatedLessons };
      }),

      resetStore: () => set({
        tracks: [], lessons: [], exams: [], files: [],
        discountCodes: [], subscriptionPrices: { monthly: 0, yearly: 0 },
        courses: [], enrolledCourses: [], enrolledCourseId: null,
      }),

      // Resets only the current course's content data.
      // Does NOT touch enrolledCourses, enrolledCourseId, courses, etc.
      // Use this after archiving/reactivating a single course.
      resetCourseData: () => set({
        tracks: [], lessons: [], exams: [], files: [],
      }),
    }),
    {
      name: "nokhba-platform-storage-v4",
      version: 4,
    }
  )
);
export type { SkillQuestion } from "@/lib/mock-data";
