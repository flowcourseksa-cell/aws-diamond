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
  const { data: sk, error: e1 } = await supabase.from('skill_progress').select('*');
  console.log("skill_progress:", sk?.length, sk);
  
  const { data: lp, error: e2 } = await supabase.from('lesson_progress').select('*');
  console.log("lesson_progress:", lp?.length, lp);
}
test();
