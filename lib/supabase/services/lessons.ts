import { createClient } from "@/lib/supabase/client";

// Admin write operations live in a server-only module ("use server").
export { createLesson, updateLesson, deleteLesson } from "./lessons-actions";

export type DbLesson = {
  id: string;
  track_id: string;
  section_id: string | null;
  micro_skill_id: string | null;
  title: string;
  video_url: string;
  teacher_name: string | null;
  duration_seconds: number | null;
  access_type: "free" | "paid";
  price: number | null;
  status: "new" | "normal" | "completed" | null;
  created_at: string;
};

// Read API (browser, anon key + RLS)
export async function fetchLessonsByTracks(trackIds: string[]): Promise<DbLesson[]> {
  if (trackIds.length === 0) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .in("track_id", trackIds)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message === 'Failed to fetch' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      console.warn("Network offline, cannot fetch lessons.");
    } else {
      console.warn("Error fetching lessons:", error);
    }
    return [];
  }
  return data as DbLesson[];
}
