create table if not exists public.platform_settings (
    id text primary key,
    settings jsonb not null default '{}'::jsonb,
    updated_at timestamp with time zone default now()
);

-- insert initial empty settings
insert into public.platform_settings (id, settings) 
values ('whatsapp_notifications', '{}'::jsonb)
on conflict (id) do nothing;
