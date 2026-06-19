import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FLOW_TRACKS, type FlowTrack, type SkillQuestion } from "@/lib/mock-data";

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
  examDate: string;          // "2026-11-01"  تاريخ الاختبار
  trackIds: string[];        // المسارات المضمنة ["qudrat-komi","qudrat-lafzi"]
  features: string[];        // ["200+ درس مصور","3000+ سؤال تدريبي","شرح المهارات الضعيفة"]
  tags: string[];            // ["قدرات","كمي","لفظي"]
  instructorName: string;    // "فريق فلو التعليمي"
  totalHours: string;        // "80 ساعة"
  studentsCount: number;     // 1200
  isActive: boolean;         // هل الدورة مفعّلة على الواجهة
  isFeatured: boolean;       // هل تظهر في الأعلى
  createdAt: string;
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
  enrolledCourseId: string | null;

  // Actions
  setTracks: (tracks: FlowTrack[] | ((prev: FlowTrack[]) => FlowTrack[])) => void;
  setLessons: (lessons: AdminLesson[] | ((prev: AdminLesson[]) => AdminLesson[])) => void;
  setExams: (exams: AdminExam[] | ((prev: AdminExam[]) => AdminExam[])) => void;
  setFiles: (files: LibraryFile[] | ((prev: LibraryFile[]) => LibraryFile[])) => void;
  setDiscountCodes: (codes: DiscountCode[] | ((prev: DiscountCode[]) => DiscountCode[])) => void;
  setSubscriptionPrices: (prices: SubscriptionPrices | ((prev: SubscriptionPrices) => SubscriptionPrices)) => void;
  setCourses: (courses: Course[] | ((prev: Course[]) => Course[])) => void;
  setEnrolledCourseId: (id: string | null) => void;

  updateItemPrice: (type: "lesson" | "exam" | "file", id: string, newPrice: number) => void;

  resetStore: () => void;
};

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set) => ({
      tracks: FLOW_TRACKS,
      lessons: [],
      exams: [],
      files: [],
      discountCodes: [],
      subscriptionPrices: { monthly: 0, yearly: 0 },
      courses: [],
      enrolledCourseId: null,

      setTracks: (updater) => set((state) => ({
        tracks: typeof updater === "function" ? updater(state.tracks) : updater
      })),

      setLessons: (updater) => set((state) => ({
        lessons: typeof updater === "function" ? updater(state.lessons) : updater
      })),

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

      setCourses: (updater) => set((state) => ({
        courses: typeof updater === "function" ? updater(state.courses) : updater
      })),

      setEnrolledCourseId: (id) => set({ enrolledCourseId: id }),

      updateItemPrice: (type, id, newPrice) => set((state) => {
        if (type === "lesson") return { lessons: state.lessons.map(l => l.id === id ? { ...l, price: newPrice } : l) };
        if (type === "exam") return { exams: state.exams.map(e => e.id === id ? { ...e, price: newPrice } : e) };
        if (type === "file") return { files: state.files.map(f => f.id === id ? { ...f, price: newPrice } : f) };
        return state;
      }),

      resetStore: () => set({
        tracks: FLOW_TRACKS, lessons: [], exams: [], files: [],
        discountCodes: [], subscriptionPrices: { monthly: 0, yearly: 0 },
        courses: [], enrolledCourseId: null,
      }),
    }),
    {
      name: "nokhba-platform-storage",
    }
  )
);
