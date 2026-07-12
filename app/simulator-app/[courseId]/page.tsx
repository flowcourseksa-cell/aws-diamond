import { redirect } from "next/navigation";
import { fetchFinalExamByCourse } from "@/lib/supabase/services/final-exam";
import { SimulatorClient } from "./simulator-client";
import { createClient } from "@/lib/supabase/server";

export default async function SimulatorAppPage({ params }: { params: Promise<{ courseId: string }> }) {
  const unwrappedParams = await params;
  const courseId = unwrappedParams.courseId;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect(`/login?redirect=/simulator/${courseId}`);
  }

  const exam = await fetchFinalExamByCourse(courseId);

  return (
    <SimulatorClient courseId={courseId} initialExam={exam} />
  );
}
