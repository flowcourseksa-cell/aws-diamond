"use server";

import { createAdminClient } from "@/lib/supabase/client";
import type { DbTrack, DbSection, DbMicroSkill } from "./hierarchy";

// -- Tracks --
export async function createTrack(courseId: string, name: string, icon?: string, color?: string): Promise<DbTrack | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tracks")
    .insert([{ course_id: courseId, name, icon, color }])
    .select()
    .single();

  if (error) {
    console.error("Error creating track:", error.message);
    return null;
  }
  return { ...data, sections: [] } as DbTrack;
}

export async function updateTrack(id: string, name: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("tracks").update({ name }).eq("id", id);
  return !error;
}

export async function deleteTrack(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("tracks").delete().eq("id", id);
  return !error;
}

// -- Sections --
export async function createSection(trackId: string, name: string): Promise<DbSection | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sections")
    .insert([{ track_id: trackId, name }])
    .select()
    .single();

  if (error) {
    console.error("Error creating section:", error.message);
    return null;
  }
  return { ...data, micro_skills: [] } as DbSection;
}

export async function updateSection(id: string, name: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("sections").update({ name }).eq("id", id);
  return !error;
}

export async function deleteSection(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("sections").delete().eq("id", id);
  return !error;
}

// -- Micro-Skills --
export async function createSkill(sectionId: string, name: string): Promise<DbMicroSkill | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("micro_skills")
    .insert([{ section_id: sectionId, name }])
    .select()
    .single();

  if (error) {
    console.error("Error creating skill:", error.message);
    return null;
  }
  return data as DbMicroSkill;
}

export async function updateSkill(id: string, name: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("micro_skills").update({ name }).eq("id", id);
  return !error;
}

export async function deleteSkill(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("micro_skills").delete().eq("id", id);
  return !error;
}
