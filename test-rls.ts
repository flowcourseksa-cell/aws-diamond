import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tdzzsmwvmddhypaoequv.supabase.co',
  'sb_secret_J3WNFRc4MGjlAPa_sz1ypA_lQSiCg2w'
);

async function run() {
  const userId = '0622620e-2ae6-4d75-a0d7-f9194536ec15'; // Student ID

  // Using raw SQL query with rpc to simulate RLS
  const { data, error } = await supabase.rpc('test_rls', { user_id: userId });
  console.log("RPC Error:", error);
  console.log("RPC Data:", data);
}
run();
