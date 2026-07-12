"use server";
import { verifyAdminAccess } from "@/lib/supabase/verify-admin";


import { createClient } from "@supabase/supabase-js";

// Use service role to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function resetStudentCourseProgress(studentId: string, courseId: string) {
  await verifyAdminAccess();
  try {
    if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase credentials");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get all tracks for this course
    const { data: tracks, error: tracksErr } = await supabase
      .from("tracks")
      .select("id")
      .eq("course_id", courseId);
      
    if (tracksErr) throw tracksErr;
    const trackIds = tracks?.map((t: any) => t.id) || [];

    // 2. Get all sections for these tracks
    let sectionIds: string[] = [];
    if (trackIds.length > 0) {
      const { data: sections } = await supabase
        .from("sections")
        .select("id")
        .in("track_id", trackIds);
      sectionIds = sections?.map((s: any) => s.id) || [];
    }

    // 3. Delete lesson progress
    if (trackIds.length > 0) {
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id")
        .in("track_id", trackIds);
      const lessonIds = lessons?.map((l: any) => l.id) || [];
      if (lessonIds.length > 0) {
        await supabase
          .from("lesson_progress")
          .delete()
          .eq("student_id", studentId)
          .in("lesson_id", lessonIds);
      }
    }

    // 4. Delete exam attempts
    if (trackIds.length > 0) {
      const { data: exams } = await supabase
        .from("exams")
        .select("id")
        .in("track_id", trackIds);
      const examIds = exams?.map((e: any) => e.id) || [];
      if (examIds.length > 0) {
        await supabase
          .from("exam_attempts")
          .delete()
          .eq("student_id", studentId)
          .in("exam_id", examIds);
      }
    }

    // 5. Delete skill progress
    if (sectionIds.length > 0) {
      const { data: skills } = await supabase
        .from("micro_skills")
        .select("id")
        .in("section_id", sectionIds);
      const skillIds = skills?.map((s: any) => s.id) || [];
      if (skillIds.length > 0) {
        await supabase
          .from("skill_progress")
          .delete()
          .eq("student_id", studentId)
          .in("micro_skill_id", skillIds);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to reset progress:", err);
    return { success: false, error: err.message };
  }
}