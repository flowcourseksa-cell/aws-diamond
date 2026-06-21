import postgres from 'postgres';

const sql = postgres('postgresql://postgres.tdzzsmwvmddhypaoequv:%23Moka222002Flow%4010@aws-0-eu-west-1.pooler.supabase.com:5432/postgres', {
  ssl: { rejectUnauthorized: false }
});

async function fixDatabase() {
  try {
    console.log("Connecting to database...");

    await sql.unsafe(`
      drop policy if exists "Admin can update all profiles" on public.profiles;
      drop policy if exists "Admin can view all profiles" on public.profiles;
    `);
    console.log("Dropped the hidden bad policies!");

    process.exit(0);
  } catch (err) {
    console.error("Database Error:", err);
    process.exit(1);
  }
}

fixDatabase();
