"use server";

import { createClient } from '@supabase/supabase-js';

export async function fetchUserEnrollments(userId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  // Check if user is an admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();

  if (profile?.role === 'admin') {
    // If admin, mock an active enrollment for every course
    const { data: courses } = await supabase.from('courses').select('id, title, features_override');
    const validCourses = (courses || []).filter((c: any) => c.title !== "اختبار الستيب ( STEP )" && !c.title.includes("محاكي"));
    return validCourses.map((c: any) => ({
      course_id: c.id,
      is_active: true,
      courses: { title: c.title, features_override: c.features_override }
    }));
  }

  const { data, error } = await supabase
    .from("enrollments")
    .select("course_id, is_active, courses(title, features_override)")
    .eq("student_id", userId);

  if (error) {
    console.error("Error fetching user enrollments:", error);
    return [];
  }

  // Filter out simulator from normal user enrollments too
  const validData = (data || []).filter((e: any) => {
    const courseTitle = Array.isArray(e.courses) ? e.courses[0]?.title : e.courses?.title;
    if (courseTitle && (courseTitle === "اختبار الستيب ( STEP )" || courseTitle.includes("محاكي"))) {
      return false;
    }
    return true;
  });

  return validData;
}

export async function countCourseEnrollments(courseId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  const { count, error } = await supabase
    .from("enrollments")
    .select("*", { count: "exact", head: true })
    .eq("course_id", courseId);

  if (error) {
    console.error("Error counting course enrollments:", error);
    return 0;
  }

  return count || 0;
}