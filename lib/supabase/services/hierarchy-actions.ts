"use server";
import { verifyAdminAccess } from "@/lib/supabase/verify-admin";


import { createAdminClient } from "@/lib/supabase/client";
import type { DbTrack, DbSection, DbMicroSkill } from "./hierarchy";

// -- Tracks --

export async function fetchHierarchyByCourseServer(courseId: string): Promise<DbTrack[]> {
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
    console.error("Error fetching hierarchy on server:", error);
    return [];
  }
  return data as unknown as DbTrack[];
}

export async function createTrack(courseId: string, name: string, icon?: string, color?: string): Promise<DbTrack | null> {
  await verifyAdminAccess();
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
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { error } = await supabase.from("tracks").update({ name }).eq("id", id);
  return !error;
}

export async function deleteTrack(id: string): Promise<boolean> {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { error } = await supabase.from("tracks").delete().eq("id", id);
  return !error;
}

// -- Sections --
export async function createSection(trackId: string, name: string): Promise<DbSection | null> {
  await verifyAdminAccess();
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
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { error } = await supabase.from("sections").update({ name }).eq("id", id);
  return !error;
}

export async function deleteSection(id: string): Promise<boolean> {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { error } = await supabase.from("sections").delete().eq("id", id);
  return !error;
}

// -- Micro-Skills --
export async function createSkill(sectionId: string, name: string, lessonId: string | null = null): Promise<DbMicroSkill | null> {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("micro_skills")
    .insert([{ section_id: sectionId, name, lesson_id: lessonId }])
    .select()
    .single();

  if (error) {
    console.error("Error creating skill:", error.message);
    return null;
  }
  return data as DbMicroSkill;
}

export async function updateSkill(id: string, name: string, lessonId?: string): Promise<boolean> {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const updateData: any = { name };
  if (lessonId !== undefined) {
    updateData.lesson_id = lessonId;
  }
  const { error } = await supabase.from("micro_skills").update(updateData).eq("id", id);
  return !error;
}

export async function deleteSkill(id: string): Promise<boolean> {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { error } = await supabase.from("micro_skills").delete().eq("id", id);
  return !error;
}