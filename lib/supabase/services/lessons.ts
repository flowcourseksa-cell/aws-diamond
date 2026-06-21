import { createClient, createAdminClient } from "@/lib/supabase/client";

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

// Instead of fetching all lessons in the DB, it's safer to fetch by trackIds since lessons belong to tracks.
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

export async function createLesson(lesson: Partial<DbLesson>): Promise<DbLesson | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("lessons")
    .insert([{
      track_id: lesson.track_id,
      section_id: lesson.section_id,
      micro_skill_id: lesson.micro_skill_id,
      title: lesson.title,
      video_url: lesson.video_url,
      teacher_name: lesson.teacher_name,
      duration_seconds: lesson.duration_seconds,
      access_type: lesson.access_type,
      price: lesson.price,
      status: lesson.status || 'normal'
    }])
    .select()
    .single();

  if (error) {
    console.error("Error creating lesson:", error);
    return null;
  }
  return data as DbLesson;
}

export async function updateLesson(id: string, lesson: Partial<DbLesson>): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("lessons")
    .update({
      track_id: lesson.track_id,
      section_id: lesson.section_id,
      micro_skill_id: lesson.micro_skill_id,
      title: lesson.title,
      video_url: lesson.video_url,
      teacher_name: lesson.teacher_name,
      duration_seconds: lesson.duration_seconds,
      access_type: lesson.access_type,
      price: lesson.price,
      status: lesson.status,
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating lesson:", error);
    return false;
  }
  return true;
}

export async function deleteLesson(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("lessons")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting lesson:", error);
    return false;
  }
  return true;
}

