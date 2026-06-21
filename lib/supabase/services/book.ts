import { createClient } from "@/lib/supabase/client";

export type BookPage = {
  id: string;
  course_id: string | null;
  page_number: number;
  title: string | null;
  body: string | null;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
};

export type BookComment = {
  id: string;
  page_id: string;
  student_id: string;
  body: string;
  created_at: string;
  author_name?: string;
};

// Fetch published pages, ordered. If courseId is provided, scope to that course.
export async function fetchBookPages(courseId?: string): Promise<BookPage[]> {
  const supabase = createClient();
  let query = supabase
    .from("book_pages")
    .select("*")
    .eq("is_published", true)
    .order("page_number", { ascending: true });

  if (courseId) query = query.eq("course_id", courseId);

  const { data, error } = await query;
  if (error) {
    console.warn("Error fetching book pages:", error.message);
    return [];
  }
  return (data || []) as BookPage[];
}

// Fetch comments for a single page, newest first, with author names.
export async function fetchPageComments(pageId: string): Promise<BookComment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("book_page_comments")
    .select("*, profiles(full_name)")
    .eq("page_id", pageId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Error fetching page comments:", error.message);
    return [];
  }
  return (data || []).map((c: any) => ({
    id: c.id,
    page_id: c.page_id,
    student_id: c.student_id,
    body: c.body,
    created_at: c.created_at,
    author_name: c.profiles?.full_name || "طالب",
  }));
}

// Add a comment as the currently signed-in student.
// RLS enforces that student_id must equal auth.uid().
export async function addPageComment(pageId: string, body: string): Promise<BookComment | null> {
  const trimmed = body.trim();
  if (!trimmed) return null;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("book_page_comments")
    .insert({ page_id: pageId, student_id: user.id, body: trimmed })
    .select("*, profiles(full_name)")
    .single();

  if (error) {
    console.warn("Error adding comment:", error.message);
    return null;
  }
  return {
    id: data.id,
    page_id: data.page_id,
    student_id: data.student_id,
    body: data.body,
    created_at: data.created_at,
    author_name: data.profiles?.full_name || "أنت",
  };
}
