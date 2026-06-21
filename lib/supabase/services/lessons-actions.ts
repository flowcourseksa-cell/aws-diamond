"use server";

import { createAdminClient } from "@/lib/supabase/client";
import type { DbLesson } from "./lessons";

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
    console.error("Error creating lesson:", error.message);
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
    console.error("Error updating lesson:", error.message);
    return false;
  }
  return true;
}

export async function deleteLesson(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) {
    console.error("Error deleting lesson:", error.message);
    return false;
  }
  return true;
}
