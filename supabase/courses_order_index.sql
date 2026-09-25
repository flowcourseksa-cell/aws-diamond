-- ترتيب الدورات في لوحة الإدارة وصفحة الهبوط (يستخدمه lib/supabase/services/courses.ts في فرع feature/final-exam-images)
-- شغّله في Supabase → SQL Editor. آمن للتشغيل أكثر من مرة.
alter table public.courses add column if not exists order_index integer default 0;
create index if not exists courses_order_index_idx on public.courses (order_index);
