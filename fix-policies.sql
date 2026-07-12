drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin" on public.profiles
    for select using (
      case 
        when auth.uid() = id then true 
        else public.is_admin() 
      end
    );

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin" on public.profiles
    for update using (
      case 
        when auth.uid() = id then true 
        else public.is_admin() 
      end
    );
