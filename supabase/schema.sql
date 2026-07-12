-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Identity & Access
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text not null check (role in ('admin', 'student')) default 'student',
  phone text,
  parent_phone text, -- Crucial for WhatsApp notifications
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  subtitle text,
  description text,
  price numeric not null default 0,
  discounted_price numeric not null default 0,
  is_active boolean default true,
  is_featured boolean default false,
  exam_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.enrollments (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  enrolled_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone,
  unique(student_id, course_id)
);

-- 2. Content Hierarchy
create table public.tracks (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  name text not null,
  icon text,
  color text default '#6366f1',
  order_index integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.sections (
  id uuid default uuid_generate_v4() primary key,
  track_id uuid references public.tracks(id) on delete cascade not null,
  name text not null,
  order_index integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.micro_skills (
  id uuid default uuid_generate_v4() primary key,
  section_id uuid references public.sections(id) on delete cascade not null,
  name text not null,
  description text,
  remedial_video_url text, -- The video sent to students when they fail this skill
  remedial_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.lessons (
  id uuid default uuid_generate_v4() primary key,
  track_id uuid references public.tracks(id) on delete cascade not null,
  section_id uuid references public.sections(id) on delete cascade,
  micro_skill_id uuid references public.micro_skills(id) on delete set null,
  title text not null,
  video_url text not null,
  teacher_name text,
  duration_seconds integer,
  access_type text check (access_type in ('free', 'paid')) default 'paid',
  price numeric default 0,
  status text check (status in ('new', 'normal', 'completed')) default 'normal',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.library_files (
  id uuid default uuid_generate_v4() primary key,
  track_id uuid references public.tracks(id) on delete cascade not null,
  micro_skill_id uuid references public.micro_skills(id) on delete set null,
  title text not null,
  file_url text not null,
  file_type text check (file_type in ('pdf', 'video', 'image', 'summary')),
  access_type text check (access_type in ('free', 'paid')) default 'paid',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Assessment Engine
create table public.exams (
  id uuid default uuid_generate_v4() primary key,
  track_id uuid references public.tracks(id) on delete cascade not null,
  section_id uuid references public.sections(id) on delete cascade,
  title text not null,
  time_limit_seconds integer not null default 3600,
  access_type text check (access_type in ('free', 'paid')) default 'paid',
  price numeric default 0,
  is_published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.questions (
  id uuid default uuid_generate_v4() primary key,
  exam_id uuid references public.exams(id) on delete cascade not null,
  micro_skill_id uuid references public.micro_skills(id) on delete restrict not null, -- CRITICAL: Must be mapped to a skill
  text text not null,
  explanation text,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')) default 'medium',
  order_index integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.question_options (
  id uuid default uuid_generate_v4() primary key,
  question_id uuid references public.questions(id) on delete cascade not null,
  text text not null,
  is_correct boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.exam_attempts (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  exam_id uuid references public.exams(id) on delete cascade not null,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  submitted_at timestamp with time zone,
  score_pct numeric,
  notification_sent boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.attempt_answers (
  id uuid default uuid_generate_v4() primary key,
  attempt_id uuid references public.exam_attempts(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  selected_option_id uuid references public.question_options(id) on delete cascade,
  is_correct boolean not null,
  micro_skill_id uuid references public.micro_skills(id) on delete cascade not null, -- Denormalized for fast O(1) grouping
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Adaptive Progress
create table public.skill_progress (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  micro_skill_id uuid references public.micro_skills(id) on delete cascade not null,
  total_questions_seen integer default 0 not null,
  correct_answers integer default 0 not null,
  mastery_score numeric default 0 not null, -- Calculated percentage
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(student_id, micro_skill_id)
);

create table public.study_plan_tasks (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  micro_skill_id uuid references public.micro_skills(id) on delete cascade,
  title text not null,
  due_date date,
  is_completed boolean default false,
  source text check (source in ('auto', 'manual')) default 'manual',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.notification_log (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  attempt_id uuid references public.exam_attempts(id) on delete set null,
  parent_phone text not null,
  message_body text not null,
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text check (status in ('sent', 'failed')) not null
);

-- RLS (Row Level Security) basics
alter table public.profiles enable row level security;
alter table public.skill_progress enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.study_plan_tasks enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can view own skill progress" on public.skill_progress for select using (auth.uid() = student_id);
create policy "Users can view own exam attempts" on public.exam_attempts for select using (auth.uid() = student_id);
create policy "Users can view own study tasks" on public.study_plan_tasks for select using (auth.uid() = student_id);

-- Function to calculate skill gap atomically
create or replace function calculate_skill_gap(p_student_id uuid, p_attempt_id uuid)
returns void as $$
declare
  r record;
begin
  for r in (
    select micro_skill_id, 
           count(*) as total_seen, 
           sum(case when is_correct then 1 else 0 end) as correct_count
    from public.attempt_answers
    where attempt_id = p_attempt_id
    group by micro_skill_id
  ) loop
    insert into public.skill_progress (student_id, micro_skill_id, total_questions_seen, correct_answers, mastery_score, last_updated)
    values (
      p_student_id, 
      r.micro_skill_id, 
      r.total_seen, 
      r.correct_count, 
      (r.correct_count::numeric / r.total_seen::numeric) * 100, 
      now()
    )
    on conflict (student_id, micro_skill_id) 
    do update set 
      total_questions_seen = skill_progress.total_questions_seen + excluded.total_questions_seen,
      correct_answers = skill_progress.correct_answers + excluded.correct_answers,
      mastery_score = GREATEST(skill_progress.mastery_score, (excluded.correct_answers::numeric / excluded.total_questions_seen::numeric) * 100),
      last_updated = now();
  end loop;
end;
$$ language plpgsql security definer;
