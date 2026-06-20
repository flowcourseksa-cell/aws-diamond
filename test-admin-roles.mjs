import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://tdzzsmwvmddhypaoequv.supabase.co', 'sb_secret_J3WNFRc4MGjlAPa_sz1ypA_lQSiCg2w');

const sql = `
  create table if not exists public.admin_roles (
    id uuid primary key references auth.users(id) on delete cascade
  );

  insert into public.admin_roles (id)
  select id from public.profiles where role = 'admin'
  on conflict do nothing;

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
`;

supabase.rpc('exec_sql', { query: sql }).then(console.log).catch(console.error);
