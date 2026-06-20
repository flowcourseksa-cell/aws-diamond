import { createClient } from "@/lib/supabase/client";
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
  
  const { data, error } = await supabase
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

  if (error) {
    console.error("Error fetching students:", error);
    return [];
  }

  return data as unknown as StudentWithDetails[];
}

// Grant access to a student for a specific course
export async function enrollStudent(studentId: string, courseId: string, expiresAt: string | null = null): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("enrollments")
    .insert([{
      student_id: studentId,
      course_id: courseId,
      expires_at: expiresAt
    }]);

  if (error) {
    console.error("Error enrolling student:", error);
    return false;
  }
  return true;
}

// Revoke access
export async function unenrollStudent(enrollmentId: string): Promise<boolean> {
  const supabase = createClient();
  
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

