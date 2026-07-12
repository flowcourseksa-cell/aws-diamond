import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PendingExamAttempt = {
  id: string; // Unique ID for the queue item
  userId: string;
  examId: string;
  rawAnswers: { question_id: string; selected_option_id: string | null; micro_skill_id: string }[];
  timestamp: number;
};

type SyncState = {
  pendingExams: PendingExamAttempt[];
  addPendingExam: (attempt: Omit<PendingExamAttempt, "id" | "timestamp">) => void;
  removePendingExam: (id: string) => void;
  clearPending: () => void;
};

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      pendingExams: [],
      addPendingExam: (attempt) => set((state) => ({
        pendingExams: [
          ...state.pendingExams,
          {
            ...attempt,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
          }
        ]
      })),
      removePendingExam: (id) => set((state) => ({
        pendingExams: state.pendingExams.filter((exam) => exam.id !== id)
      })),
      clearPending: () => set({ pendingExams: [] }),
    }),
    {
      name: "nokhba-sync-queue",
      version: 1,
    }
  )
);
