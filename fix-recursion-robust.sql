-- 1. Drop ALL existing policies on profiles to ensure a clean state
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
drop policy if exists "profiles_update_self_or_admin" on public.profiles;
drop policy if exists "profiles_insert_self_or_admin" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- 2. Create recursion-safe function
create or replace function public.is_admin()
returns boolean
language sql
security definer
as $$
  -- By using a subquery that only gets 'role' where id matches, and NOT using RLS (since security definer + postgres runs it)
  -- Actually, the safest way to avoid recursion is to read auth.jwt()
  select coalesce((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- Wait, the user might not have app_metadata. Let's use the CASE WHEN approach instead!

create or replace function public.is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 3. Create policies using CASE WHEN to guarantee short-circuiting
create policy "profiles_select_safe" on public.profiles
    for select using (
      case 
        when auth.uid() = id then true 
        else public.is_admin() 
      end
    );

create policy "profiles_update_safe" on public.profiles
    for update using (
      case 
        when auth.uid() = id then true 
        else public.is_admin() 
      end
    );

create policy "profiles_insert_safe" on public.profiles
    for insert with check (
      case 
        when auth.uid() = id then true 
        else public.is_admin() 
      end
    );
