-- ============================================================
-- طريقة إنشاء الحسابات: التنفيذ على مستوى قاعدة البيانات
-- ============================================================
-- يُطبَّق مرة واحدة (آمن للتكرار). يعمل مع الإعداد registration_admin_only في platform_settings
-- الذي يضبطه المدير من صفحة «الإعدادات والصلاحيات».
--
-- 1) عندما يكون الإغلاق مفعّلاً، يُرفض إنشاء أي مستخدم جديد في auth.users لا يحمل
--    app_metadata.created_by = 'admin' (وهو ما يضعه زر «إضافة حساب طالب» في لوحة الإدارة).
--    يشمل ذلك التسجيل بالبريد، ودخول جوجل لحساب جديد، وروابط OTP، وحتى «Add user» من لوحة Supabase.
--    الحسابات الموجودة لا تتأثر إطلاقاً (الـ trigger على الإدراج فقط).
-- 2) قفل أعمدة الصلاحيات في profiles: كان بإمكان أي مستخدم مسجّل تعديل role/admin_level/is_banned
--    لنفسه عبر PostgREST (سياسة التحديث الذاتي بلا قيد على الأعمدة). الآن لا يعدّلها إلا مفتاح الخدمة.

-- ── 1. رفض التسجيل الذاتي أثناء الإغلاق ─────────────────────────────
create or replace function public.enforce_registration_mode()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  closed boolean;
begin
  select value into closed
  from public.platform_settings
  where key = 'registration_admin_only';

  if coalesce(closed, false)
     and coalesce(new.raw_app_meta_data->>'created_by', '') <> 'admin' then
    raise exception 'registration_closed'
      using hint = 'Self-registration is disabled; accounts are created by the platform admin.';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_registration_mode() from public;
grant execute on function public.enforce_registration_mode() to supabase_auth_admin;

drop trigger if exists enforce_registration_mode on auth.users;
create trigger enforce_registration_mode
  before insert on auth.users
  for each row execute function public.enforce_registration_mode();

-- ── 2. قفل أعمدة الصلاحيات في profiles ─────────────────────────────
-- ملاحظة: كان لدور authenticated امتياز UPDATE على الجدول كله، وإلغاء امتياز على أعمدة بعينها لا يؤثر
-- ما دام الامتياز على مستوى الجدول قائماً؛ لذلك نلغي الامتياز الجدولي ثم نمنح الأعمدة الآمنة فقط.
-- لا يوجد في التطبيق أي كتابة على profiles من المتصفح (كل الكتابات عبر مفتاح الخدمة في الخادم)،
-- والمنح أدناه احتياط لأي تعديل ذاتي مستقبلي لبيانات الملف الشخصي.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, phone, parent_phone, last_active_at) on public.profiles to authenticated;
