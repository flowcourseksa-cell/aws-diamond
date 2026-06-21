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
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tracks")
    .select(`
      *,
      sections (
        *,
        micro_skills (*)
      )
    `)
    .eq("course_id", courseId)
    .order("order_index", { ascending: true })
    .order("order_index", { ascending: true, foreignTable: "sections" })
    .order("created_at", { ascending: true, foreignTable: "sections.micro_skills" });

  if (error) {
    if (error.message === 'Failed to fetch' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      console.warn("Network offline, cannot fetch hierarchy.");
    } else {
      console.warn("Error fetching hierarchy:", error);
    }
    return [];
  }

  return data as unknown as DbTrack[];
}
