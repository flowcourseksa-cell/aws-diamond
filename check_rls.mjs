import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.rpc('execute_sql', {
    query: "SELECT relname, polname, polcmd, polqual FROM pg_policy JOIN pg_class ON pg_policy.polrelid = pg_class.oid WHERE relname = 'profiles';"
  });
  
  if (error) {
    console.error("RPC failed, trying raw data:", error);
    // Let's just fetch a profile to see if it hangs for service role
    const { data: p, error: e } = await supabase.from('profiles').select('*').limit(1);
    console.log("Service role fetch:", p, e);
  } else {
    console.log("Policies:", data);
  }
}
check();
