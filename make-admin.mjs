import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tdzzsmwvmddhypaoequv.supabase.co';
const supabaseKey = 'sb_secret_J3WNFRc4MGjlAPa_sz1ypA_lQSiCg2w';
const supabase = createClient(supabaseUrl, supabaseKey);

async function makeEveryoneAdmin() {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .neq('role', 'admin'); // Update everyone who isn't already admin

  if (error) {
    console.error("Error updating roles:", error);
  } else {
    console.log("Success! Everyone is now an admin.");
  }
}

makeEveryoneAdmin();
