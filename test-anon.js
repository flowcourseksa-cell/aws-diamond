const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // USE ANON KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking skill_progress with anon key...");
  const { data: sk, error: skError } = await supabase.from('skill_progress').select('micro_skill_id, mastery_score, total_questions_seen, correct_answers').limit(1);
  console.log("Skill Progress Error:", skError);

  console.log("Checking lesson_progress with anon key...");
  const { data: lp, error: lpError } = await supabase.from('lesson_progress').select('*').limit(1);
  console.log("Lesson Progress Error:", lpError);
}

run();
