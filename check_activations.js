const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function check() {
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', 'd441fe32-e143-4811-981e-63c852dffa80');
  console.log("Profile:", profile);

  // Now query as anon
  const anonSupabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await anonSupabase.from('enrollments').select('id, profiles(full_name)').eq('is_active', false);
  console.log("Anon fetch:", data, "Error:", error);
}
check();
