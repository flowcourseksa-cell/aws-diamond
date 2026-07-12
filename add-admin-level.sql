-- 1. Add admin_level column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_level text DEFAULT 'super' CHECK (admin_level IN ('super', 'content'));

-- 2. Update existing admins to 'super'
UPDATE public.profiles SET admin_level = 'super' WHERE role = 'admin';
