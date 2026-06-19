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
  sectionId?: string; // added section support just in case
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

// ── Store Definition ─────────────────────────────────────────────

type PlatformState = {
  // Data
  tracks: FlowTrack[];
  lessons: AdminLesson[];
  exams: AdminExam[];
  files: LibraryFile[];
  discountCodes: DiscountCode[];
  subscriptionPrices: SubscriptionPrices;
  
  // Actions
  setTracks: (tracks: FlowTrack[] | ((prev: FlowTrack[]) => FlowTrack[])) => void;
  setLessons: (lessons: AdminLesson[] | ((prev: AdminLesson[]) => AdminLesson[])) => void;
  setExams: (exams: AdminExam[] | ((prev: AdminExam[]) => AdminExam[])) => void;
  setFiles: (files: LibraryFile[] | ((prev: LibraryFile[]) => LibraryFile[])) => void;
  setDiscountCodes: (codes: DiscountCode[] | ((prev: DiscountCode[]) => DiscountCode[])) => void;
  setSubscriptionPrices: (prices: SubscriptionPrices | ((prev: SubscriptionPrices) => SubscriptionPrices)) => void;
  
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

      updateItemPrice: (type, id, newPrice) => set((state) => {
        if (type === "lesson") return { lessons: state.lessons.map(l => l.id === id ? { ...l, price: newPrice } : l) };
        if (type === "exam") return { exams: state.exams.map(e => e.id === id ? { ...e, price: newPrice } : e) };
        if (type === "file") return { files: state.files.map(f => f.id === id ? { ...f, price: newPrice } : f) };
        return state;
      }),

      resetStore: () => set({ tracks: FLOW_TRACKS, lessons: [], exams: [], files: [], discountCodes: [], subscriptionPrices: { monthly: 0, yearly: 0 } }),
    }),
    {
      name: "nokhba-platform-storage",
      // Without skipHydration, Zustand might mismatch Server vs Client.
      // We will handle it by only rendering data after mount.
    }
  )
);
