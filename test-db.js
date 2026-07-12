
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking skill_progress...");
  const { data: sk, error: skError } = await supabase.from('skill_progress').select('id').limit(1);
  console.log("Skill Progress Error:", skError);

  console.log("Checking lesson_progress...");
  const { data: lp, error: lpError } = await supabase.from('lesson_progress').select('id').limit(1);
  console.log("Lesson Progress Error:", lpError);
}

run();
