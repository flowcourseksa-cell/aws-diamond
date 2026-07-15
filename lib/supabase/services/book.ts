// @ts-nocheck
import { createClient } from "@/lib/supabase/client";

export type Book = {
  id: string;
  course_id: string;
  title: string;
  subtitle: string | null;
  cover_image: string | null;
  cover_gradient: string;
  is_published: boolean;
  comments_enabled: boolean;
  created_at: string;
};

export type BookPage = {
  id: string;
  book_id: string;
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
  parent_id: string | null;
  is_admin_reply: boolean;
  author_name?: string;
  replies?: BookComment[];
};

export async function fetchBooksByCourse(courseId: string): Promise<Book[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("Error fetching books:", error.message);
    return [];
  }
  return (data || []) as Book[];
}

export async function fetchBooksByIds(bookIds: string[]): Promise<Book[]> {
  if (!bookIds || bookIds.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .in("id", bookIds)
    .eq("is_published", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("Error fetching books by ids:", error.message);
    return [];
  }
  return (data || []) as Book[];
}

// Fetch published pages, ordered. If bookId is provided, scope to that book.
export async function fetchBookPages(bookId?: string): Promise<BookPage[]> {
  const supabase = createClient();
  let query = supabase
    .from("book_pages")
    .select("*")
    .eq("is_published", true)
    .order("page_number", { ascending: true });

  if (bookId) query = query.eq("book_id", bookId);

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
    parent_id: c.parent_id,
    is_admin_reply: c.is_admin_reply,
    author_name: c.profiles?.full_name || "طالب",
  }));
}

// Add a comment as the currently signed-in student.
// RLS enforces that student_id must equal auth.uid().
// Returns "banned" if the student is banned from commenting.
export async function addPageComment(
  pageId: string,
  body: string,
  parentId: string | null = null,
  isAdminReply: boolean = false
): Promise<BookComment | "banned" | null> {
  const trimmed = body.trim();
  if (!trimmed) return null;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // SECURITY: Check if student is banned from comments before inserting
  if (!isAdminReply) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("is_banned_from_comments")
      .eq("id", user.id)
      .single();
    if (profileData?.is_banned_from_comments) return "banned";
  }

  const { data, error } = await supabase
    .from("book_page_comments")
    .insert({ page_id: pageId, student_id: user.id, body: trimmed, parent_id: parentId, is_admin_reply: isAdminReply })
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
    parent_id: data.parent_id,
    is_admin_reply: data.is_admin_reply,
    author_name: data.profiles?.full_name || "أنت",
  };
}

export async function deleteMyComment(commentId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("book_page_comments")
    .delete()
    .eq("id", commentId)
    .eq("student_id", user.id);

  if (error) {
    console.warn("Error deleting comment:", error.message);
    return false;
  }
  return true;
}
