-- 1. Drop ALL existing policies to ensure clean state
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
drop policy if exists "profiles_update_self_or_admin" on public.profiles;
drop policy if exists "profiles_insert_self_or_admin" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- 2. Create the is_admin function using Dynamic SQL to hide it from the dependency graph
-- This prevents the "infinite recursion detected in policy" compile-time error.
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
as $$
declare
  v_is_admin boolean;
begin
  -- Using EXECUTE hides the dependency on public.profiles from the planner
  execute 'select exists (select 1 from public.profiles where id = $1 and role = ''admin'')'
  into v_is_admin
  using auth.uid();
  
  return coalesce(v_is_admin, false);
end;
$$;

-- 3. Create the safe policies
create policy "profiles_select_safe" on public.profiles
    for select using ( auth.uid() = id or public.is_admin() );

create policy "profiles_update_safe" on public.profiles
    for update using ( auth.uid() = id or public.is_admin() );

create policy "profiles_insert_safe" on public.profiles
    for insert with check ( auth.uid() = id or public.is_admin() );
