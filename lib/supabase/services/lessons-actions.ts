"use server";

import { verifyAdminAccess } from "@/lib/supabase/verify-admin";

import { createAdminClient } from "@/lib/supabase/client";
import { sendPlatformNotification } from "@/lib/notifications/server-push";
import type { DbLesson } from "./lessons";

export async function createLesson(lesson: Partial<DbLesson>): Promise<DbLesson | null> {
  await verifyAdminAccess();
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
  await verifyAdminAccess();
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
      cover_image: lesson.cover_image,
      comments_enabled: lesson.comments_enabled,
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating lesson:", error.message);
    return false;
  }
  return true;
}

export async function deleteLesson(id: string): Promise<boolean> {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) {
    console.error("Error deleting lesson:", error.message);
    return false;
  }
  return true;
}

export async function uploadLessonCover(formData: FormData): Promise<string | null> {
  await verifyAdminAccess();
  const file = formData.get("file") as File;
  if (!file) return null;
  const supabase = createAdminClient();
  const ext = file.name.split(".").pop();
  const fileName = `lesson-cover-${Date.now()}.${ext}`;

  await supabase.storage.createBucket("lesson_covers", { public: true }).catch(() => {});

  const { error } = await supabase.storage.from("lesson_covers").upload(fileName, file);
  if (error) {
    console.error("Error uploading lesson cover:", error.message);
    return null;
  }

  const { data } = supabase.storage.from("lesson_covers").getPublicUrl(fileName);
  return data.publicUrl;
}

export async function fetchLessonComments(lessonId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("lesson_comments")
    .select("*, profiles(full_name)")
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: true });
    
  if (error) {
    console.warn("Error fetching lesson comments:", error.message);
    return [];
  }
  
  return data.map((d: any) => ({
    id: d.id,
    lesson_id: d.lesson_id,
    student_id: d.student_id,
    body: d.body,
    created_at: d.created_at,
    parent_id: d.parent_id,
    is_admin_reply: d.is_admin_reply,
    author_name: d.profiles?.full_name || (d.is_admin_reply ? "الأوس الماسية" : "طالب غير معروف"),
  }));
}

export async function addLessonComment(
  lessonId: string,
  studentId: string,
  body: string,
  parentId?: string,
  isAdminReply = false
) {
  const supabase = createAdminClient();

  if (!isAdminReply) {
    const { data: bans } = await supabase
      .from("comment_bans")
      .select("lesson_id")
      .eq("student_id", studentId);
    
    if (bans && bans.length > 0) {
      const isGlobalBan = bans.some((b: any) => b.lesson_id === null);
      const isLessonBan = bans.some((b: any) => b.lesson_id === lessonId);
      if (isGlobalBan || isLessonBan) {
        return { error: "أنت محظور من التعليق." };
      }
    }

    if (parentId) {
      const { count } = await supabase
        .from("lesson_comments")
        .select("*", { count: 'exact', head: true })
        .eq("parent_id", parentId);
      
      if (count !== null && count >= 6) {
        return { error: "تم الوصول للحد الأقصى من الردود لهذا التعليق (6 ردود)." };
      }
    }
  }

  const payload: any = {
    lesson_id: lessonId,
    student_id: studentId,
    body,
    is_admin_reply: isAdminReply,
  };
  if (parentId) payload.parent_id = parentId;

  const { data, error } = await supabase.from("lesson_comments").insert([payload]).select("*, profiles(full_name)").single();
  if (error) {
    console.warn("Error adding lesson comment:", error.message);
    return { error: "حدث خطأ" };
  }

  // Handle Notifications
  if (parentId && data) {
    const { data: parent } = await supabase.from("lesson_comments").select("student_id").eq("id", parentId).single();
    if (parent && parent.student_id && parent.student_id !== studentId) {
      const title = isAdminReply ? "رد جديد من الإدارة" : "رد جديد على تعليقك";
      const message = isAdminReply ? "قامت الإدارة بالرد على تعليقك في إحدى الدروس." : "قام أحد زملائك بالرد على تعليقك.";
      
      await sendPlatformNotification(supabase, {
        userIds: [parent.student_id],
        title,
        message,
        type: "system",
        url: "/dashboard" // Or specific lesson page if we had it
      });

      // Prune notifications to max 5
      const { data: notifs } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", parent.student_id)
        .order("created_at", { ascending: false });

      if (notifs && notifs.length > 5) {
        const toDelete = notifs.slice(5).map(n => n.id);
        await supabase.from("notifications").delete().in("id", toDelete);
      }
    }
  }

  return {
    id: data.id,
    lesson_id: data.lesson_id,
    student_id: data.student_id,
    body: data.body,
    created_at: data.created_at,
    parent_id: data.parent_id,
    is_admin_reply: data.is_admin_reply,
    author_name: data.profiles?.full_name || (isAdminReply ? "الأوس الماسية" : "طالب غير معروف"),
  };
}

export async function deleteLessonComment(commentId: string) {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { error } = await supabase.from("lesson_comments").delete().eq("id", commentId);
  if (error) {
    console.warn("Error deleting lesson comment:", error.message);
    return false;
  }
  return true;
}

export async function editLessonComment(commentId: string, newBody: string) {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { error } = await supabase.from("lesson_comments").update({ body: newBody }).eq("id", commentId);
  if (error) {
    console.warn("Error editing lesson comment:", error.message);
    return false;
  }
  return true;
}

export async function banStudentFromComments(studentId: string, lessonId: string | null = null) {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { error } = await supabase.from("comment_bans").insert([
    { student_id: studentId, lesson_id: lessonId }
  ]);
  if (error) {
    console.warn("Error banning student:", error.message);
    return false;
  }
  return true;
}

export async function unbanStudentFromComments(studentId: string, lessonId: string | null = null) {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  let query = supabase.from("comment_bans").delete().eq("student_id", studentId);
  if (lessonId) {
    query = query.eq("lesson_id", lessonId);
  } else {
    query = query.is("lesson_id", null);
  }
  
  const { error } = await query;
  if (error) {
    console.warn("Error unbanning student:", error.message);
    return false;
  }
  return true;
}

export async function getCommentBans(lessonId?: string) {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  let query = supabase.from("comment_bans").select("student_id, lesson_id, profiles(full_name)");
  if (lessonId) {
    query = query.or(`lesson_id.eq.${lessonId},lesson_id.is.null`);
  }
  const { data, error } = await query;
  if (error) {
    console.warn("Error fetching comment bans:", error.message);
    return [];
  }
  return data;
}

export async function getVideoUploadUrl(fileName: string) {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  await supabase.storage.createBucket("lesson_videos", { public: true }).catch(() => {});
  const { data, error } = await supabase.storage.from("lesson_videos").createSignedUploadUrl(fileName);
  if (error) {
    console.warn("Error creating video upload url:", error.message);
    return null;
  }
  return data;
}

export async function getPublicVideoUrl(fileName: string) {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { data } = supabase.storage.from("lesson_videos").getPublicUrl(fileName);
  return data.publicUrl;
}

export const uploadLessonCoverImage = uploadLessonCover;
