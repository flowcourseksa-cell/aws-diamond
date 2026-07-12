const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  console.log("Updating schema...");
  
  // Actually, Supabase doesn't have an 'exec_sql' RPC by default unless we created it.
  // Wait, does 'exec_sql' exist? Let's check.
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      create table if not exists public.granted_exam_attempts (
        id uuid default uuid_generate_v4() primary key,
        student_id uuid references public.profiles(id) on delete cascade not null,
        exam_id text not null,
        granted_at timestamp with time zone default timezone('utc'::text, now()) not null
      );
      alter table public.granted_exam_attempts enable row level security;
      
      drop policy if exists "Users can view own granted attempts" on public.granted_exam_attempts;
      create policy "Users can view own granted attempts" on public.granted_exam_attempts for select using (auth.uid() = student_id);
      
      alter table public.study_plan_tasks add column if not exists exam_id text;
    `
  });
  
  if (error) {
    console.error("RPC exec_sql failed. It might not exist:", error);
    // Let's create an edge function or just ask the user to run it if it fails.
  } else {
    console.log("Success:", data);
  }
})();
