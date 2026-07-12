-- =====================================================================
--  Advanced Interactive Book Migration
--  Apply MANUALLY in the Supabase SQL editor.
-- =====================================================================

-- 1. Create `books` table
create table if not exists public.books (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  subtitle text,
  cover_image text,
  cover_gradient text default 'from-indigo-500 to-purple-600',
  is_published boolean not null default true,
  comments_enabled boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_books_course on public.books(course_id);

-- 2. Modify `book_pages` table
-- Clean up experimental data to enforce new foreign keys smoothly
delete from public.book_page_comments;
delete from public.book_pages;

-- Drop old unique constraint
alter table public.book_pages drop constraint if exists book_pages_course_id_page_number_key;

-- Add book_id
alter table public.book_pages add column if not exists book_id uuid references public.books(id) on delete cascade;

-- Set NOT NULL
alter table public.book_pages alter column book_id set not null;

-- Drop course_id
alter table public.book_pages drop column if exists course_id;

-- Add new unique constraint
alter table public.book_pages add constraint book_pages_book_id_page_number_key unique (book_id, page_number);

-- 3. Modify `book_page_comments` table
alter table public.book_page_comments add column if not exists parent_id uuid references public.book_page_comments(id) on delete cascade;
alter table public.book_page_comments add column if not exists is_admin_reply boolean not null default false;

-- 4. Add comments ban to `profiles`
alter table public.profiles add column if not exists is_banned_from_comments boolean not null default false;

-- 5. RLS for `books`
alter table public.books enable row level security;

drop policy if exists "books_select" on public.books;
create policy "books_select" on public.books
  for select using (is_published = true or public.is_admin());

drop policy if exists "books_admin_write" on public.books;
create policy "books_admin_write" on public.books
  for all using (public.is_admin()) with check (public.is_admin());