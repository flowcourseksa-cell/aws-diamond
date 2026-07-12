import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tdzzsmwvmddhypaoequv.supabase.co';
const serviceKey = 'sb_secret_J3WNFRc4MGjlAPa_sz1ypA_lQSiCg2w';
const supabase = createClient(supabaseUrl, serviceKey);

async function fixAdminProfile() {
  try {
    const userId = '0622620e-2ae6-4d75-a0d7-f9194536ec15';
    
    console.log('🔄 جاري تحديث البروفايل...');

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        parent_phone: '0500000000',
        role: 'admin',
      })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('❌ خطأ:', error.message);
      return;
    }

    console.log('✅ تم التحديث:', profile);
    console.log('✨ الآن يمكن للأدمن الدخول بشكل صحيح!');
  } catch (err) {
    console.error('❌ خطأ عام:', err);
  }
}

fixAdminProfile();
