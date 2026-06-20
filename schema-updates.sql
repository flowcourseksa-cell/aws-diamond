-- 1. ���� ��� ���� ������ ������
create table if not exists public.lesson_progress (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  is_completed boolean default false not null,
  progress_seconds integer default 0 not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(student_id, lesson_id)
);

alter table public.lesson_progress enable row level security;

-- ������� ������ ����� ������ ���
create policy "Users can view own lesson progress" 
on public.lesson_progress for select 
using (auth.uid() = student_id);

create policy "Users can insert own lesson progress" 
on public.lesson_progress for insert 
with check (auth.uid() = student_id);

create policy "Users can update own lesson progress" 
on public.lesson_progress for update 
using (auth.uid() = student_id);

-- 2. ����� ������� ������ (Admin RLS) ����� �� ���
create policy "Admin can view all profiles"
on public.profiles for select
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Admin can update all profiles"
on public.profiles for update
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Admin can view all skill progress"
on public.skill_progress for select
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Admin can view all exam attempts"
on public.exam_attempts for select
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Admin can view all lesson progress"
on public.lesson_progress for select
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Admin can view all enrollments"
on public.enrollments for select
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);
