"use server";

import { createAdminClient } from "@/lib/supabase/client";
import type { DbTrack } from "./hierarchy";
import type { DbLesson } from "./lessons";

export async function fetchHierarchyByCourseAdmin(courseId: string): Promise<DbTrack[]> {
  const supabase = createAdminClient();
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
    console.error("Error fetching hierarchy:", error);
    return [];
  }
  return data as DbTrack[];
}

export async function fetchLessonsByTracksAdmin(trackIds: string[]): Promise<DbLesson[]> {
  if (trackIds.length === 0) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .in("track_id", trackIds)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching lessons:", error);
    return [];
  }
  return data as DbLesson[];
}
