import { createClient } from "@/lib/supabase/client";

// Admin write operations live in a server-only module ("use server").
export { createFile, updateFile, deleteFile, incrementFileDownload } from "./library-actions";

export type DbLibraryFile = {
  id: string;
  track_id: string;
  micro_skill_id: string | null;
  title: string;
  file_url: string;
  file_type: "pdf" | "video" | "image" | "summary" | null;
  category: "ملازم وتأسيس" | "ملخصات سريعة" | "بنك أسئلة وتجميعات" | "أوراق عمل" | null;
  cover_image: string | null;
  pages_count: number | null;
  downloads_count: number | null;
  size_label: string | null;
  access_type: "free" | "paid";
  created_at: string;
};

// Read API (browser, anon key + RLS)
export async function fetchFilesByTracks(trackIds: string[]): Promise<DbLibraryFile[]> {
  if (trackIds.length === 0) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("library_files")
    .select("*")
    .in("track_id", trackIds)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message === 'Failed to fetch' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      console.warn("Network offline, cannot fetch library files.");
    } else {
      console.warn("Error fetching library files:", error);
    }
    return [];
  }
  return data as DbLibraryFile[];
}
