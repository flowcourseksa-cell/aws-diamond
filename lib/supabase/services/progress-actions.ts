"use server";
import { createAdminClient } from "@/lib/supabase/client";
import { unstable_noStore as noStore } from "next/cache";

export async function fetchUserProgressServer(userId: string) {
  noStore();
  const supabase = createAdminClient();
  
  // Fetch skill progress
  const { data: skills, error: skillsError } = await supabase
    .from("skill_progress")
    .select("micro_skill_id, mastery_score, total_questions_seen, correct_answers")
    .eq("student_id", userId);

  if (skillsError) {
    console.error("Error fetching skill progress Server:", skillsError?.message || skillsError);
  }

  // Fetch lesson progress
  const { data: lessons, error: lessonsError } = await supabase
    .from("lesson_progress")
    .select("lesson_id, is_completed, progress_seconds")
    .eq("student_id", userId);

  if (lessonsError) {
    console.error("Error fetching lesson progress Server:", lessonsError?.message || lessonsError);
  }

  console.log("====== SERVER FETCHED PROGRESS ======", userId, "SKILLS:", skills?.length, "LESSONS:", lessons?.length);

  return {
    skills: skills || [],
    lessons: lessons || [],
  };
}
