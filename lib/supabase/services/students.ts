"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { type Course } from "@/lib/store";

function getReadClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function fetchProfileServer(userId: string) {
  try {
    const supabase = getReadClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .limit(1)
      .single();
    if (error) return null;
    return data;
  } catch (err) {
    console.error("fetchProfileServer error:", err);
    return null;
  }
}

export type DbProfile = {
  id: string;
  full_name: string;
  role: "admin" | "student";
  phone: string | null;
  parent_phone: string | null;
  created_at: string;
  is_banned?: boolean;
  last_active_at?: string;
  warning_level?: number;
  last_report_sent_at?: string;
};

export type DbEnrollment = {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  expires_at: string | null;
  course?: Course; // Joined course data
};

export type StudentWithDetails = DbProfile & {
  enrollments: DbEnrollment[];
};

// Fetch all profiles with role='student'
export async function fetchStudents(): Promise<StudentWithDetails[]> {
  const supabase = getReadClient();
  
  // We'll fetch all students and filter enrollments in javascript.
  const { data: allProfiles, error: fetchErr } = await supabase
    .from("profiles")
    .select(`
      *,
      enrollments (
        *,
        course:courses(*)
      )
    `)
    .eq("role", "student")
    .order("created_at", { ascending: false });

  if (fetchErr) {
    console.warn("Error fetching students:", fetchErr);
    return [];
  }

  // Filter out pending enrollments
  const filteredData = (allProfiles || []).map((student: any) => ({
    ...student,
    enrollments: (student.enrollments || []).filter((e: any) => e.is_active === true)
  }));

  return filteredData as unknown as StudentWithDetails[];
}

// Grant access to a student for a specific course
export async function enrollStudent(studentId: string, courseId: string, expiresAt: string | null = null): Promise<boolean> {
  const supabase = getAdminClient();
  
  const { error } = await supabase
    .from("enrollments")
    .upsert([{
      student_id: studentId,
      course_id: courseId,
      expires_at: expiresAt,
      is_active: true
    }], { onConflict: "student_id, course_id" });

  if (error) {
    console.error("Error enrolling student:", error);
    return false;
  }
  return true;
}

// Revoke access
export async function unenrollStudent(enrollmentId: string): Promise<boolean> {
  const supabase = getAdminClient();
  
  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq("id", enrollmentId);

  if (error) {
    console.error("Error unenrolling student:", error);
    return false;
  }
  return true;
}

export async function updateStudent(studentId: string, updates: Partial<DbProfile>): Promise<boolean> {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", studentId);
  
  if (error) {
    console.error("Error updating student:", error);
    return false;
  }
  return true;
}

export async function toggleStudentBan(studentId: string, isBanned: boolean): Promise<boolean> {
  return updateStudent(studentId, { is_banned: isBanned });
}

export async function updateStudentPassword(studentId: string, newPassword: string): Promise<boolean> {
  const supabase = getAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(studentId, {
    password: newPassword
  });
  
  if (error) {
    console.error("Error updating student password:", error);
    return false;
  }
  return true;
}

export async function deleteStudentCompletely(studentId: string): Promise<boolean> {
  const supabase = getAdminClient();
  
  // Attempt to delete auth user (this usually cascades)
  const { error: authError } = await supabase.auth.admin.deleteUser(studentId);
  
  // Just in case cascade is not on, delete from profiles explicitly
  await supabase.from("profiles").delete().eq("id", studentId);
  
  if (authError) {
    console.error("Error deleting student from auth:", authError);
    // If we fail here it might be because the user wasn't in auth, but still in profiles.
  }
  
  return true;
}
