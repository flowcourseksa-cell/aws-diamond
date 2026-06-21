import { createClient, createAdminClient } from "@/lib/supabase/client";
import { type Course } from "@/lib/store";

export type DbProfile = {
  id: string;
  full_name: string;
  role: "admin" | "student";
  phone: string | null;
  parent_phone: string | null;
  created_at: string;
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
  const supabase = createClient();
  
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
    console.error("Error enrolling student:", error);
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
    console.error("Error unenrolling student:", error);
    return false;
  }
  return true;
}

