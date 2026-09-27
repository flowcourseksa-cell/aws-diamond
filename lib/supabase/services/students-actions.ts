"use server";
import { verifyAdminAccess } from "@/lib/supabase/verify-admin";


import { createAdminClient } from "@/lib/supabase/client";
import { unenrollStudentInternal } from "@/lib/supabase/services/students-internal";
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
  return unenrollStudentInternal(enrollmentId);
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