-- =====================================================================
--  Cloud isolation + missing tables + Row Level Security (RLS)
--  Apply this file MANUALLY in the Supabase SQL editor.
--  It is idempotent: safe to run multiple times.
--
--  Goals:
--   1. Add the missing `lesson_progress` table used by the app.
--   2. Add an `is_admin()` helper so admins bypass student restrictions.
--   3. Enable RLS on every table and add policies so that:
--      - Each student can read/write ONLY their own rows.
--      - Learning content is readable only by enrolled students (admins: all).
--      - Admins (profiles.role = 'admin') have full access everywhere.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Missing table: lesson_progress
-- ---------------------------------------------------------------------
create table if not exists public.lesson_progress (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  is_completed boolean default false not null,
  progress_seconds integer default 0 not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (student_id, lesson_id)
);

-- ---------------------------------------------------------------------
-- 1. Admin helper (security definer to avoid recursive RLS on profiles)
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Helper: is the current user enrolled in the course that owns a track?
create or replace function public.is_enrolled_in_track(p_track_id uuid)
returns boolean as $$
  select exists (
    select 1
    from public.tracks t
    join public.enrollments e on e.course_id = t.course_id
    where t.id = p_track_id
      and e.student_id = auth.uid()
      and (e.expires_at is null or e.expires_at > now())
  );
$$ language sql security definer stable;

-- ---------------------------------------------------------------------
-- 2. Enable RLS on every table
-- ---------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.courses             enable row level security;
alter table public.enrollments         enable row level security;
alter table public.tracks              enable row level security;
alter table public.sections            enable row level security;
alter table public.micro_skills        enable row level security;
alter table public.lessons             enable row level security;
alter table public.library_files       enable row level security;
alter table public.exams               enable row level security;
alter table public.questions           enable row level security;
alter table public.question_options    enable row level security;
alter table public.exam_attempts       enable row level security;
alter table public.attempt_answers     enable row level security;
alter table public.skill_progress      enable row level security;
alter table public.study_plan_tasks    enable row level security;
alter table public.lesson_progress     enable row level security;
alter table public.notification_log    enable row level security;

-- ---------------------------------------------------------------------
-- 3. PROFILES
-- ---------------------------------------------------------------------
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert_self_or_admin" on public.profiles;
create policy "profiles_insert_self_or_admin" on public.profiles
  for insert with check (auth.uid() = id or public.is_admin());

-- ---------------------------------------------------------------------
-- 4. COURSES (publicly readable when active; admins manage)
-- ---------------------------------------------------------------------
drop policy if exists "courses_select_all" on public.courses;
create policy "courses_select_all" on public.courses
  for select using (is_active = true or public.is_admin());

drop policy if exists "courses_admin_write" on public.courses;
create policy "courses_admin_write" on public.courses
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 5. ENROLLMENTS (student sees only own; admin manages all)
-- ---------------------------------------------------------------------
drop policy if exists "enrollments_select_own_or_admin" on public.enrollments;
create policy "enrollments_select_own_or_admin" on public.enrollments
  for select using (student_id = auth.uid() or public.is_admin());

drop policy if exists "enrollments_admin_write" on public.enrollments;
create policy "enrollments_admin_write" on public.enrollments
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 6. LEARNING CONTENT (read: enrolled students or admin; write: admin)
--    tracks / sections / micro_skills / lessons / library_files
-- ---------------------------------------------------------------------
drop policy if exists "tracks_select_enrolled_or_admin" on public.tracks;
create policy "tracks_select_enrolled_or_admin" on public.tracks
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.enrollments e
      where e.course_id = tracks.course_id
        and e.student_id = auth.uid()
        and (e.expires_at is null or e.expires_at > now())
    )
  );
drop policy if exists "tracks_admin_write" on public.tracks;
create policy "tracks_admin_write" on public.tracks
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "sections_select_enrolled_or_admin" on public.sections;
create policy "sections_select_enrolled_or_admin" on public.sections
  for select using (public.is_admin() or public.is_enrolled_in_track(track_id));
drop policy if exists "sections_admin_write" on public.sections;
create policy "sections_admin_write" on public.sections
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "micro_skills_select_enrolled_or_admin" on public.micro_skills;
create policy "micro_skills_select_enrolled_or_admin" on public.micro_skills
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.sections s
      where s.id = micro_skills.section_id
        and public.is_enrolled_in_track(s.track_id)
    )
  );
drop policy if exists "micro_skills_admin_write" on public.micro_skills;
create policy "micro_skills_admin_write" on public.micro_skills
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "lessons_select_enrolled_or_admin" on public.lessons;
create policy "lessons_select_enrolled_or_admin" on public.lessons
  for select using (
    public.is_admin()
    or access_type = 'free'
    or public.is_enrolled_in_track(track_id)
  );
drop policy if exists "lessons_admin_write" on public.lessons;
create policy "lessons_admin_write" on public.lessons
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "library_files_select_enrolled_or_admin" on public.library_files;
create policy "library_files_select_enrolled_or_admin" on public.library_files
  for select using (
    public.is_admin()
    or access_type = 'free'
    or public.is_enrolled_in_track(track_id)
  );
drop policy if exists "library_files_admin_write" on public.library_files;
create policy "library_files_admin_write" on public.library_files
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 7. ASSESSMENT CONTENT (exams / questions / options)
-- ---------------------------------------------------------------------
drop policy if exists "exams_select_enrolled_or_admin" on public.exams;
create policy "exams_select_enrolled_or_admin" on public.exams
  for select using (
    public.is_admin()
    or access_type = 'free'
    or public.is_enrolled_in_track(track_id)
  );
drop policy if exists "exams_admin_write" on public.exams;
create policy "exams_admin_write" on public.exams
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "questions_select_enrolled_or_admin" on public.questions;
create policy "questions_select_enrolled_or_admin" on public.questions
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.exams ex
      where ex.id = questions.exam_id
        and (ex.access_type = 'free' or public.is_enrolled_in_track(ex.track_id))
    )
  );
drop policy if exists "questions_admin_write" on public.questions;
create policy "questions_admin_write" on public.questions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "question_options_select_enrolled_or_admin" on public.question_options;
create policy "question_options_select_enrolled_or_admin" on public.question_options
  for select using (
    public.is_admin()
    or exists (
      select 1
      from public.questions q
      join public.exams ex on ex.id = q.exam_id
      where q.id = question_options.question_id
        and (ex.access_type = 'free' or public.is_enrolled_in_track(ex.track_id))
    )
  );
drop policy if exists "question_options_admin_write" on public.question_options;
create policy "question_options_admin_write" on public.question_options
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 8. STUDENT-OWNED DATA (each student strictly isolated)
--    exam_attempts / attempt_answers / skill_progress
--    study_plan_tasks / lesson_progress / notification_log
-- ---------------------------------------------------------------------
drop policy if exists "exam_attempts_select_own_or_admin" on public.exam_attempts;
create policy "exam_attempts_select_own_or_admin" on public.exam_attempts
  for select using (student_id = auth.uid() or public.is_admin());
drop policy if exists "exam_attempts_insert_own" on public.exam_attempts;
create policy "exam_attempts_insert_own" on public.exam_attempts
  for insert with check (student_id = auth.uid());
drop policy if exists "exam_attempts_update_own_or_admin" on public.exam_attempts;
create policy "exam_attempts_update_own_or_admin" on public.exam_attempts
  for update using (student_id = auth.uid() or public.is_admin());

drop policy if exists "attempt_answers_select_own_or_admin" on public.attempt_answers;
create policy "attempt_answers_select_own_or_admin" on public.attempt_answers
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.exam_attempts a
      where a.id = attempt_answers.attempt_id and a.student_id = auth.uid()
    )
  );
drop policy if exists "attempt_answers_insert_own" on public.attempt_answers;
create policy "attempt_answers_insert_own" on public.attempt_answers
  for insert with check (
    exists (
      select 1 from public.exam_attempts a
      where a.id = attempt_answers.attempt_id and a.student_id = auth.uid()
    )
  );

drop policy if exists "skill_progress_select_own_or_admin" on public.skill_progress;
create policy "skill_progress_select_own_or_admin" on public.skill_progress
  for select using (student_id = auth.uid() or public.is_admin());
drop policy if exists "skill_progress_insert_own" on public.skill_progress;
create policy "skill_progress_insert_own" on public.skill_progress
  for insert with check (student_id = auth.uid());
drop policy if exists "skill_progress_update_own" on public.skill_progress;
create policy "skill_progress_update_own" on public.skill_progress
  for update using (student_id = auth.uid());

drop policy if exists "study_plan_tasks_select_own_or_admin" on public.study_plan_tasks;
create policy "study_plan_tasks_select_own_or_admin" on public.study_plan_tasks
  for select using (student_id = auth.uid() or public.is_admin());
drop policy if exists "study_plan_tasks_modify_own" on public.study_plan_tasks;
create policy "study_plan_tasks_modify_own" on public.study_plan_tasks
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists "lesson_progress_select_own_or_admin" on public.lesson_progress;
create policy "lesson_progress_select_own_or_admin" on public.lesson_progress
  for select using (student_id = auth.uid() or public.is_admin());
drop policy if exists "lesson_progress_modify_own" on public.lesson_progress;
create policy "lesson_progress_modify_own" on public.lesson_progress
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists "notification_log_select_own_or_admin" on public.notification_log;
create policy "notification_log_select_own_or_admin" on public.notification_log
  for select using (student_id = auth.uid() or public.is_admin());
drop policy if exists "notification_log_admin_write" on public.notification_log;
create policy "notification_log_admin_write" on public.notification_log
  for all using (public.is_admin()) with check (public.is_admin());
