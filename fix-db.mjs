import postgres from 'postgres';

const sql = postgres('postgresql://postgres.tdzzsmwvmddhypaoequv:%23Moka222002Flow%4010@aws-0-eu-west-1.pooler.supabase.com:5432/postgres', {
  ssl: { rejectUnauthorized: false }
});

async function fixDatabase() {
  try {
    console.log("Connecting to database...");

    await sql.unsafe(`
      create table if not exists public.admin_roles (
        id uuid primary key references auth.users(id) on delete cascade
      );
    `);
    console.log("Created admin_roles table");

    await sql.unsafe(`
      insert into public.admin_roles (id)
      select id from public.profiles where role = 'admin'
      on conflict do nothing;
    `);
    console.log("Copied admins");

    await sql.unsafe(`
      create or replace function public.is_admin()
      returns boolean
      language sql
      security definer
      as $$
        select exists (
          select 1 from public.admin_roles
          where id = auth.uid()
        );
      $$;
    `);
    console.log("Replaced is_admin function");

    await sql.unsafe(`
      drop policy if exists "profiles_select_self_or_admin" on public.profiles;
      drop policy if exists "profiles_update_self_or_admin" on public.profiles;
      drop policy if exists "profiles_insert_self_or_admin" on public.profiles;
      drop policy if exists "Users can view own profile" on public.profiles;
      drop policy if exists "Users can update own profile" on public.profiles;
      drop policy if exists "profiles_select_safe" on public.profiles;
      drop policy if exists "profiles_update_safe" on public.profiles;
      drop policy if exists "profiles_insert_safe" on public.profiles;
    `);
    console.log("Dropped bad policies");

    await sql.unsafe(`
      create policy "profiles_select_safe" on public.profiles
          for select using ( auth.uid() = id or public.is_admin() );

      create policy "profiles_update_safe" on public.profiles
          for update using ( auth.uid() = id or public.is_admin() );

      create policy "profiles_insert_safe" on public.profiles
          for insert with check ( auth.uid() = id or public.is_admin() );
    `);
    console.log("Created safe policies");

    console.log("ALL FIXES APPLIED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("Database Error:", err);
    process.exit(1);
  }
}

fixDatabase();