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
  const courseId = "47aa95cf-b6e1-40fc-933e-d3a17d8232bf"; // الدوره المدفوعة
  
  // Login as student
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'khaled@test.com',
    password: 'password123'
  });
  
  if (authErr) {
    console.log("Login failed:", authErr.message);
    // try another user from test-diag
    const { data: authData2, error: authErr2 } = await supabase.auth.signInWithPassword({
        email: 'khaled2@test.com',
        password: 'password123'
    });
    if (authErr2) {
      console.log("Login 2 failed:", authErr2.message);
    } else {
      console.log("Logged in!");
    }
  } else {
    console.log("Logged in!");
  }

  const { data: tData, error: tErr } = await supabase.from("tracks").select('*').eq("course_id", courseId);
  console.log("Tracks:", JSON.stringify(tData), tErr);

  const { data: sData, error: sErr } = await supabase.from("sections").select('*');
  console.log("Sections count:", sData?.length, sErr);

  const { data: mData, error: mErr } = await supabase.from("micro_skills").select('*');
  console.log("Micro_skills count:", mData?.length, mErr);
}
test();
