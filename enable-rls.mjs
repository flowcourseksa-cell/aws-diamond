import postgres from 'postgres';
const sql = postgres('postgresql://postgres.tdzzsmwvmddhypaoequv:%23Moka222002Flow%4010@aws-0-eu-west-1.pooler.supabase.com:5432/postgres', { ssl: { rejectUnauthorized: false } });

async function enableRLS() {
  try {
    const tables = [
      'profiles', 'courses', 'tracks', 'sections', 'micro_skills', 
      'lessons', 'study_plan_tasks', 'lesson_progress', 'admin_roles'
    ];
    
    for (const table of tables) {
      await sql.unsafe(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }
    
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
}

enableRLS();
