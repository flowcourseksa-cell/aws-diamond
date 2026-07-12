import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key);

async function check() {
  const { data } = await supabase.from('enrollments').select('*');
  console.log("Enrollments in DB:", data?.length);
  if (data) {
    data.forEach(e => console.log(e.id, e.student_id, e.course_id, e.is_active));
  }
}
check();