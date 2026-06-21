-- =====================================================================
--  Interactive Book feature: pages + per-page student comments.
--  Apply MANUALLY in the Supabase SQL editor. Idempotent & safe to rerun.
-- =====================================================================

-- Pages of a book. A book is tied to a course (optional) so admins can
-- publish a flip-book per course. Pages are ordered by page_number.
create table if not exists public.book_pages (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade,
  page_number integer not null default 1,
  title text,
  body text,                -- نص الصفحة (اختياري)
  image_url text,           -- صورة الصفحة (اختياري)
  is_published boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (course_id, page_number)
);

-- A student's comment on a specific page.
create table if not exists public.book_page_comments (
  id uuid default uuid_generate_v4() primary key,
  page_id uuid references public.book_pages(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  body text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_book_pages_course on public.book_pages(course_id, page_number);
create index if not exists idx_book_comments_page on public.book_page_comments(page_id, created_at);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.book_pages         enable row level security;
alter table public.book_page_comments enable row level security;

-- Pages: readable by any authenticated user when published; admins manage all.
-- (Relies on public.is_admin() created in rls_and_fixes.sql.)
drop policy if exists "book_pages_select" on public.book_pages;
create policy "book_pages_select" on public.book_pages
  for select using (is_published = true or public.is_admin());

drop policy if exists "book_pages_admin_write" on public.book_pages;
create policy "book_pages_admin_write" on public.book_pages
  for all using (public.is_admin()) with check (public.is_admin());

-- Comments: everyone authenticated can read; a student writes only their own;
-- a student edits/deletes only their own; admins manage all.
drop policy if exists "book_comments_select" on public.book_page_comments;
create policy "book_comments_select" on public.book_page_comments
  for select using (auth.uid() is not null);

drop policy if exists "book_comments_insert_own" on public.book_page_comments;
create policy "book_comments_insert_own" on public.book_page_comments
  for insert with check (student_id = auth.uid());

drop policy if exists "book_comments_modify_own_or_admin" on public.book_page_comments;
create policy "book_comments_modify_own_or_admin" on public.book_page_comments
  for update using (student_id = auth.uid() or public.is_admin());

drop policy if exists "book_comments_delete_own_or_admin" on public.book_page_comments;
create policy "book_comments_delete_own_or_admin" on public.book_page_comments
  for delete using (student_id = auth.uid() or public.is_admin());
