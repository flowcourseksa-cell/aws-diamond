import { createClient } from "@/lib/supabase/client";

export type StudyPlanTask = {
  id: string;
  student_id: string;
  micro_skill_id: string | null;
  title: string;
  due_date: string | null; // YYYY-MM-DD
  is_completed: boolean;
  source: "auto" | "manual";
  created_at: string;
};

export type NewStudyPlanTask = {
  title: string;
  due_date: string | null;
  micro_skill_id?: string | null;
};

// All study-plan data is real and per-student (isolated by RLS).
export async function fetchStudyPlanTasks(studentId: string): Promise<StudyPlanTask[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("study_plan_tasks")
    .select("id, student_id, micro_skill_id, title, due_date, is_completed, source, created_at, exam_id")
    .eq("student_id", studentId)
    .order("due_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching study plan tasks:", error);
    return [];
  }
  return data as StudyPlanTask[];
}

export async function addStudyPlanTask(
  studentId: string,
  task: NewStudyPlanTask
): Promise<StudyPlanTask | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("study_plan_tasks")
    .insert([{
      student_id: studentId,
      title: task.title,
      due_date: task.due_date,
      micro_skill_id: task.micro_skill_id ?? null,
      source: "manual",
      is_completed: false,
    }])
    .select()
    .single();

  if (error) {
    console.error("Error adding study plan task:", error);
    return null;
  }
  return data as StudyPlanTask;
}

export async function toggleStudyPlanTask(
  taskId: string,
  isCompleted: boolean
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("study_plan_tasks")
    .update({ is_completed: isCompleted })
    .eq("id", taskId);

  if (error) {
    console.error("Error toggling study plan task:", error);
    return false;
  }
  return true;
}

export async function updateStudyPlanTaskDate(
  taskId: string,
  dueDate: string
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("study_plan_tasks")
    .update({ due_date: dueDate })
    .eq("id", taskId);

  if (error) {
    console.error("Error moving study plan task:", error);
    return false;
  }
  return true;
}

export async function deleteStudyPlanTask(taskId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("study_plan_tasks").delete().eq("id", taskId);
  if (error) {
    console.error("Error deleting study plan task:", error);
    return false;
  }
  return true;
}
