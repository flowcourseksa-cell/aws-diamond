import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key);

async function test() {
  const { data: n } = await supabase.from('notifications').select('user_id, title, type').limit(20);
  console.log("Notifications:");
  n?.forEach(x => console.log(x.user_id, x.title, x.type));
}
test();