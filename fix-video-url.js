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

async function fix() {
  const url = 'https://tdzzsmwvmddhypaoequv.supabase.co/storage/v1/object/public/lesson_videos/video_2026-07-07_03-35-36.mp4';
  const { error } = await supabaseAdmin.from('lessons').update({ video_url: url }).eq('id', '07eecc4a-7db2-453e-8f17-6e7d4ef63643');
  if (error) console.error(error);
  console.log("Fixed video URL");
}
fix();
