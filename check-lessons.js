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

async function checkLessons() {
  const { data: lessons, error } = await supabaseAdmin.from('lessons').select('*');
  if (error) console.error(error);
  console.log("Lessons in DB:", lessons.map(l => ({ id: l.id, title: l.title, videoUrl: l.video_url })));
}
checkLessons();
