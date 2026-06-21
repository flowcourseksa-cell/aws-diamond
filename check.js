const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('enrollments').select('*').eq('is_active', false);
  console.log("Pending Enrollments:", JSON.stringify(data, null, 2));
  if (error) console.error("Error:", error);
}
check();
