"use server";

import { createClient } from '@supabase/supabase-js';

export async function fetchUserEnrollments(userId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from("enrollments")
    .select("course_id, is_active")
    .eq("student_id", userId);

  if (error) {
    console.error("Error fetching user enrollments:", error);
    return [];
  }

  return data || [];
}
