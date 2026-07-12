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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data: auth, error: err } = await supabase.auth.signInWithPassword({
    email: 'khaled@test.com',
    password: 'password123'
  });
  
  if (err) {
    console.error("Login failed", err.message);
    return;
  }
  
  console.log("Logged in as:", auth.user.id);
  
  const { data: sk, error: e1 } = await supabase.from('skill_progress').select('*');
  console.log("skill_progress via RLS:", sk?.length, sk);
  
  const { data: lp, error: e2 } = await supabase.from('lesson_progress').select('*');
  console.log("lesson_progress via RLS:", lp?.length, lp);
}
test();
