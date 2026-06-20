import { createClient } from "@/lib/supabase/client";

export type DbLibraryFile = {
  id: string;
  track_id: string;
  micro_skill_id: string | null;
  title: string;
  file_url: string;
  file_type: "pdf" | "video" | "image" | "summary" | null;
  access_type: "free" | "paid";
  created_at: string;
  // Let's add extra fields not strictly in schema but needed by UI, or map them dynamically
  // If the DB doesn't have price, size, or date, we use defaults or store them in JSON/metadata if we had it.
};

export async function fetchFilesByTracks(trackIds: string[]): Promise<DbLibraryFile[]> {
  if (trackIds.length === 0) return [];
  
  const supabase = createClient();
  const { data, error } = await supabase
    .from("library_files")
    .select("*")
    .in("track_id", trackIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching library files:", error);
    return [];
  }
  return data as DbLibraryFile[];
}

export async function createFile(file: Partial<DbLibraryFile>): Promise<DbLibraryFile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("library_files")
    .insert([{
      track_id: file.track_id,
      micro_skill_id: file.micro_skill_id,
      title: file.title,
      file_url: file.file_url,
      file_type: file.file_type,
      access_type: file.access_type || 'paid',
    }])
    .select()
    .single();

  if (error) {
    console.error("Error creating file:", error);
    return null;
  }
  return data as DbLibraryFile;
}

export async function updateFile(id: string, file: Partial<DbLibraryFile>): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("library_files")
    .update({
      track_id: file.track_id,
      micro_skill_id: file.micro_skill_id,
      title: file.title,
      file_url: file.file_url,
      file_type: file.file_type,
      access_type: file.access_type,
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating file:", error);
    return false;
  }
  return true;
}

export async function deleteFile(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("library_files")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting file:", error);
    return false;
  }
  return true;
}

