import postgres from 'postgres';
const sql = postgres('postgresql://postgres.tdzzsmwvmddhypaoequv:%23Moka222002Flow%4010@aws-0-eu-west-1.pooler.supabase.com:5432/postgres', { ssl: { rejectUnauthorized: false } });

async function getAdmin() {
  const users = await sql`select * from admin_roles`;
  console.log(users);
  process.exit(0);
}
getAdmin();