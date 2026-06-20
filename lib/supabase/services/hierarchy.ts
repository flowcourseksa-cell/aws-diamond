import { createClient } from "@/lib/supabase/client";

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

// --- API Functions ---

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
    console.error("Error fetching hierarchy:", error);
    return [];
  }

  return data as unknown as DbTrack[];
}

// -- Tracks --
export async function createTrack(courseId: string, name: string, icon?: string, color?: string): Promise<DbTrack | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tracks")
    .insert([{ course_id: courseId, name, icon, color }])
    .select()
    .single();

  if (error) {
    console.error("Error creating track:", error);
    return null;
  }
  return { ...data, sections: [] } as DbTrack;
}

export async function updateTrack(id: string, name: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("tracks").update({ name }).eq("id", id);
  return !error;
}

export async function deleteTrack(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("tracks").delete().eq("id", id);
  return !error;
}

// -- Sections --
export async function createSection(trackId: string, name: string): Promise<DbSection | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sections")
    .insert([{ track_id: trackId, name }])
    .select()
    .single();

  if (error) {
    console.error("Error creating section:", error);
    return null;
  }
  return { ...data, micro_skills: [] } as DbSection;
}

export async function updateSection(id: string, name: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("sections").update({ name }).eq("id", id);
  return !error;
}

export async function deleteSection(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("sections").delete().eq("id", id);
  return !error;
}

// -- Micro-Skills --
export async function createSkill(sectionId: string, name: string): Promise<DbMicroSkill | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("micro_skills")
    .insert([{ section_id: sectionId, name }])
    .select()
    .single();

  if (error) {
    console.error("Error creating skill:", error);
    return null;
  }
  return data as DbMicroSkill;
}

export async function updateSkill(id: string, name: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("micro_skills").update({ name }).eq("id", id);
  return !error;
}

export async function deleteSkill(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("micro_skills").delete().eq("id", id);
  return !error;
}

