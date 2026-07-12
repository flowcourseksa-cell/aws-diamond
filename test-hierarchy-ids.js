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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: courses } = await supabase.from('courses').select('id, title');
  console.log("Courses:", courses);
  
  for (const c of courses) {
    const { data: tracks } = await supabase.from('tracks').select('id, name, sections(id, name, micro_skills(id, name))').eq('course_id', c.id);
    console.log(`Course ${c.title} (${c.id}) tracks:`, JSON.stringify(tracks, null, 2));
  }
}
test();
