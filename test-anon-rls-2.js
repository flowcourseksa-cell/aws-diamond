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
  const { data: lData, error: lErr } = await supabase.from("lessons").select('*');
  console.log("Lessons count:", lData?.length, lErr);

  const { data: eData, error: eErr } = await supabase.from("exams").select('*');
  console.log("Exams count:", eData?.length, eErr);

  const { data: fData, error: fErr } = await supabase.from("files").select('*');
  console.log("Files count:", fData?.length, fErr);
}
test();
