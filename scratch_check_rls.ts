import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { count: c1, error: e1 } = await supabase.from("lessons").select("id", { count: "exact", head: true });
  console.log("total lessons count:", c1, e1);

  const { count: c2, error: e2 } = await supabase
    .from("lesson_progress")
    .select("lesson_id, lessons!inner(track_id)", { count: "exact", head: true })
    .eq("is_completed", true);
  console.log("completed lessons count:", c2, e2);
  
  const { data: c3, error: e3 } = await supabase
    .from("lesson_progress")
    .select("lesson_id, lessons!inner(track_id)");
  console.log("lesson progress data with track:", c3?.slice(0, 2), e3);
}

run();
