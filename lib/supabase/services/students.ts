import { createClient } from "@/lib/supabase/client";
import { type Course } from "@/lib/store";

// Admin write operations live in a server-only module ("use server").
export { enrollStudent, unenrollStudent } from "./students-actions";

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
