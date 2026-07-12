import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://tdzzsmwvmddhypaoequv.supabase.co', 'sb_secret_J3WNFRc4MGjlAPa_sz1ypA_lQSiCg2w');
supabase.rpc('exec_sql', { query: "select policyname, qual from pg_policies where tablename = 'profiles';" }).then(res => console.log(JSON.stringify(res, null, 2))).catch(console.error);