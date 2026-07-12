import { createClient } from "@supabase/supabase-js";
import SimulatorBuilder from "./simulator-builder";

export const dynamic = "force-dynamic";

export default async function SimulatorBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. Fetch Course info
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: course } = await supabase.from("courses").select("*").eq("id", id).single();

  if (!course) {
    return <div className="p-10 text-center font-bold text-red-500">المحاكي غير موجود</div>;
  }

  // 2. Fetch or Create Final Exam
  let { data: exam } = await supabase.from("final_exams").select("*").eq("course_id", id).maybeSingle();

  if (!exam) {
    // Create it
    const { data: newExam } = await supabase.from("final_exams").insert({
      course_id: id,
      title: course.title,
      time_limit_minutes: 150,
      passing_score: 50,
      max_attempts: 10,
      is_published: true
    }).select().single();
    exam = newExam;
  }

  // 3. Fetch Questions
  const { data: questions } = await supabase
    .from("final_exam_questions")
    .select("*, options:final_exam_question_options(*)")
    .eq("final_exam_id", exam.id)
    .order("order_index", { ascending: true });

  return (
    <SimulatorBuilder 
      courseId={id}
      courseTitle={course.title}
      examId={exam.id}
      initialQuestions={questions || []}
    />
  );
}
