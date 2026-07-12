import postgres from 'postgres';
const sql = postgres('postgresql://postgres.tdzzsmwvmddhypaoequv:%23Moka222002Flow%4010@aws-0-eu-west-1.pooler.supabase.com:5432/postgres', { ssl: { rejectUnauthorized: false } });

async function nukeRLS() {
  try {
    const tables = [
      'profiles', 'courses', 'tracks', 'sections', 'micro_skills', 
      'lessons', 'study_plan_tasks', 'lesson_progress', 'admin_roles'
    ];
    
    for (const table of tables) {
      await sql.unsafe(`ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;`);
      console.log(`Disabled RLS on ${table}`);
    }
    
    console.log("RLS NUKED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

nukeRLS();