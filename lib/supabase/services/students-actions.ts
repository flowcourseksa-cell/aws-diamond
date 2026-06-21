"use server";

import { createAdminClient } from "@/lib/supabase/client";

// Grant access to a student for a specific course
export async function enrollStudent(studentId: string, courseId: string, expiresAt: string | null = null): Promise<boolean> {
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
  const supabase = createAdminClient();

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
