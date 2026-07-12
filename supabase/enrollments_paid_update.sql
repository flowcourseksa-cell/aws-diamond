alter table public.enrollments
add column if not exists discount_code text,
add column if not exists final_price numeric,
add column if not exists payment_status text check (payment_status in ('free', 'pending', 'paid')) default 'free';
