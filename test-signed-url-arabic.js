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

async function testSignedUrl() {
  const { data, error } = await supabaseAdmin.storage.from("lesson_videos").createSignedUploadUrl("فيديو جديد 2026.mp4");
  if (error) console.error("Error:", error);
  console.log("Signed URL Data:", data);
}
testSignedUrl();
