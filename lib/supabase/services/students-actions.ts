"use server";
import { verifyAdminAccess } from "@/lib/supabase/verify-admin";


import { createAdminClient } from "@/lib/supabase/client";
import { revalidatePath } from "next/cache";

// Grant access to a student for a specific course
export async function enrollStudent(studentId: string, courseId: string, expiresAt: string | null = null): Promise<boolean> {
  await verifyAdminAccess();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("enrollments")
    .upsert([{
      student_id: studentId,
      course_id: courseId,
      expires_at: expiresAt,
      is_active: true
    }], { onConflict: "student_id, course_id" });

  if (error) {
    console.error("Error enrolling student:", error.message);
    return false;
  }
  return true;
}

// Revoke access
export async function unenrollStudent(enrollmentId: string): Promise<boolean> {
  await verifyAdminAccess();
  const supabase = createAdminClient();

  // 1. Fetch enrollment to know the student and course
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("student_id, course_id")
    .eq("id", enrollmentId)
    .single();

  if (!enrollment) {
    console.error("Enrollment not found");
    return false;
  }

  const { student_id, course_id } = enrollment;

  // Fetch Tracks
  const { data: tracks } = await supabase.from("tracks").select("id").eq("course_id", course_id);
  if (tracks && tracks.length > 0) {
    const trackIds = tracks.map((t: any) => t.id);

    // 2. Clear Exams Attempts (exams belong to tracks)
    const { data: exams } = await supabase.from("exams").select("id").in("track_id", trackIds);
    if (exams && exams.length > 0) {
      const examIds = exams.map((e: any) => e.id);
      await supabase.from("exam_attempts").delete().eq("student_id", student_id).in("exam_id", examIds);
    }

    // 3. Clear Lesson Progress & Skills
    const { data: sections } = await supabase.from("sections").select("id").in("track_id", trackIds);
    if (sections && sections.length > 0) {
      const sectionIds = sections.map((s: any) => s.id);
      
      // 3a. Clear Lessons
      const { data: lessons } = await supabase.from("lessons").select("id").in("section_id", sectionIds);
      if (lessons && lessons.length > 0) {
        const lessonIds = lessons.map((l: any) => l.id);
        await supabase.from("lesson_progress").delete().eq("student_id", student_id).in("lesson_id", lessonIds);
      }

      // 3b. Clear Study Plan Tasks & Skill Progress (micro_skills belong to sections)
      const { data: micros } = await supabase.from("micro_skills").select("id").in("section_id", sectionIds);
      if (micros && micros.length > 0) {
        const microIds = micros.map((m: any) => m.id);
        // Clear remedial tasks
        await supabase.from("study_plan_tasks").delete().eq("student_id", student_id).in("micro_skill_id", microIds);
        // Clear actual skill progress
        await supabase.from("skill_progress").delete().eq("student_id", student_id).in("micro_skill_id", microIds);
      }
    }
  }

  // 5. Delete the enrollment itself
  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq("id", enrollmentId);

  if (error) {
    console.error("Error unenrolling student:", error.message);
    return false;
  }
  return true;
}

export async function updateStudentProfile(studentId: string, profile: {full_name?: string, phone?: string, parent_phone?: string}) {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  await supabase.from("profiles").update(profile).eq("id", studentId);
  revalidatePath("/", "layout");
  return true;
}

export async function updateStudentPassword(studentId: string, newPassword: string) {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(studentId, { password: newPassword });
  if (error) {
    console.error("Error updating password:", error.message);
    return false;
  }
  return true;
}

export async function banStudent(studentId: string, banned: boolean) {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { error } = await supabase.from("profiles").update({ banned }).eq("id", studentId);
  if (error) {
    console.error("Error banning student:", error.message);
    return false;
  }
  revalidatePath("/", "layout");
  return true;
}

export async function deleteStudent(studentId: string) {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(studentId);
  if (error) {
    console.error("Error deleting student:", error.message);
    return false;
  }
  revalidatePath("/", "layout");
  return true;
}