import { createClient } from "@/lib/supabase/client";

// Admin write operations live in a server-only module ("use server").
// Re-exported here so existing imports keep working unchanged.
export {
  createTrack, updateTrack, deleteTrack,
  createSection, updateSection, deleteSection,
  createSkill, updateSkill, deleteSkill,
} from "./hierarchy-actions";

// --- Types ---
export type DbMicroSkill = {
  id: string;
  section_id: string;
  lesson_id: string | null;
  name: string;
  description: string | null;
  remedial_video_url: string | null;
  remedial_notes: string | null;
  created_at: string;
};

export type DbSection = {
  id: string;
  track_id: string;
  name: string;
  order_index: number;
  created_at: string;
  micro_skills: DbMicroSkill[];
};

export type DbTrack = {
  id: string;
  course_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  order_index: number;
  created_at: string;
  sections: DbSection[];
};

// --- Read API (browser, anon key + RLS) ---

// Fetch the entire tree for a given course
export async function fetchHierarchyByCourse(courseId: string): Promise<DbTrack[]> {
  const { fetchHierarchyByCourseServer } = await import("./hierarchy-actions");
  return fetchHierarchyByCourseServer(courseId);
}
