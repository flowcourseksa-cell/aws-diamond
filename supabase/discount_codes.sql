create table if not exists public.discount_codes (
    id uuid default uuid_generate_v4() primary key,
    code text not null unique,
    discount_percent numeric not null default 0,
    uses integer not null default 0,
    max_uses integer not null default 0,
    expiry_date timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.discount_codes enable row level security;
create policy "Anyone can read discount codes" on public.discount_codes for select using (true);
create policy "Admins can insert discount codes" on public.discount_codes for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can update discount codes" on public.discount_codes for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can delete discount codes" on public.discount_codes for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
