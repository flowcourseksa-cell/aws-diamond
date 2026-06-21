import postgres from 'postgres';

const sql = postgres('postgresql://postgres.tdzzsmwvmddhypaoequv:%23Moka222002Flow%4010@aws-0-eu-west-1.pooler.supabase.com:5432/postgres', {
  ssl: { rejectUnauthorized: false }
});

async function checkPolicies() {
  try {
    const policies = await sql`
      select policyname, qual, with_check 
      from pg_policies 
      where tablename = 'profiles';
    `;
    console.log("Current policies on profiles:", policies);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkPolicies();
