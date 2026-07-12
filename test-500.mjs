import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://tdzzsmwvmddhypaoequv.supabase.co', 'sb_publishable_gJy5VpH6lIEjeGT56ootVw_fSo8tjrT');
supabase.from('profiles').select('*').limit(1).then(res => console.log(JSON.stringify(res, null, 2))).catch(console.error);