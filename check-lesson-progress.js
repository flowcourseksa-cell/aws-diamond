const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [k, ...v] = line.split('=');
    env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
  }
});
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkLessonProgress() {
  const { data: progress, error } = await supabaseAdmin.from('lesson_progress').select('*');
  if (error) console.error(error);
  console.log("Lesson Progress in DB:", progress.map(p => ({ student: p.student_id, lesson: p.lesson_id, completed: p.is_completed, seconds: p.progress_seconds })));
}
checkLessonProgress();
