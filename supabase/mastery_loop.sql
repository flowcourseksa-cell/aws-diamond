-- جدول تتبع المحاولات الاستثنائية المهداة
create table if not exists public.granted_exam_attempts (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  exam_id text not null,
  granted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.granted_exam_attempts enable row level security;

drop policy if exists "Users can view own granted attempts" on public.granted_exam_attempts;
create policy "Users can view own granted attempts" on public.granted_exam_attempts for select using (auth.uid() = student_id);

-- إضافة عمود exam_id للمهام لربط المهمة بالاختبار الذي أُنشئت منه
alter table public.study_plan_tasks add column if not exists exam_id text;
