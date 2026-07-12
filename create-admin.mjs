import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tdzzsmwvmddhypaoequv.supabase.co';
const serviceKey = 'sb_secret_J3WNFRc4MGjlAPa_sz1ypA_lQSiCg2w';
const supabase = createClient(supabaseUrl, serviceKey);

async function updateAdminRole() {
  try {
    const userId = '0622620e-2ae6-4d75-a0d7-f9194536ec15';
    
    console.log('🔄 جاري تحديث دور الأدمن...');

    // Update existing profile to be admin
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: 'خالد - الأدمن',
        role: 'admin',
      })
      .eq('id', userId)
      .select();

    if (updateError) {
      console.error('❌ خطأ في تحديث الملف الشخصي:', updateError.message);
      return;
    }

    console.log('✅ تم تحديث ملف الأدمن:', profile);
    console.log('\n✨ حساب الأدمن جاهز!');
    console.log('📧 البريد: khaled-ksa-2026@gmail.com');
    console.log('🔐 كلمة المرور: alaws2026');
  } catch (err) {
    console.error('❌ خطأ عام:', err);
  }
}

updateAdminRole();
