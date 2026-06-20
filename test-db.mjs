import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://tdzzsmwvmddhypaoequv.supabase.co', 'sb_secret_J3WNFRc4MGjlAPa_sz1ypA_lQSiCg2w');
supabase.from('profiles').select('*').then(console.log).catch(console.error);
