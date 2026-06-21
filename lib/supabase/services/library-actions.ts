"use server";

import { createAdminClient } from "@/lib/supabase/client";
import type { DbLibraryFile } from "./library";

export async function createFile(file: Partial<DbLibraryFile>): Promise<DbLibraryFile | null> {
  const supabase = createAdminClient();
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
    console.error("Error creating file:", error.message);
    return null;
  }
  return data as DbLibraryFile;
}

export async function updateFile(id: string, file: Partial<DbLibraryFile>): Promise<boolean> {
  const supabase = createAdminClient();
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
    console.error("Error updating file:", error.message);
    return false;
  }
  return true;
}

export async function deleteFile(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("library_files").delete().eq("id", id);
  if (error) {
    console.error("Error deleting file:", error.message);
    return false;
  }
  return true;
}
