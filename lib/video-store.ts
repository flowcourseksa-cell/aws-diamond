import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LastWatchedVideo = {
  lessonId: string;
  courseId: string | null;
  lessonTitle: string;
  currentTime: number;
  duration: number;
  coverUrl?: string;
  trackColor?: string;
  sectionName?: string;
};

type VideoStore = {
  lastWatched: LastWatchedVideo | null;
  setLastWatched: (video: LastWatchedVideo | null) => void;
  clearLastWatched: () => void;
};

export const useVideoStore = create<VideoStore>()(
  persist(
    (set) => ({
      lastWatched: null,
      setLastWatched: (video) => set({ lastWatched: video }),
      clearLastWatched: () => set({ lastWatched: null }),
    }),
    {
      name: "tkhsas-video-storage",
    }
  )
);
