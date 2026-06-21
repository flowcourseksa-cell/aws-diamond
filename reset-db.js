const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tdzzsmwvmddhypaoequv.supabase.co',
  'sb_secret_J3WNFRc4MGjlAPa_sz1ypA_lQSiCg2w',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function resetDB() {
  console.log("Starting full database reset...");

  try {
    // 1. Delete all enrollments
    const { error: err1 } = await supabase.from('enrollments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err1) console.error("Error deleting enrollments:", err1);
    else console.log("✅ Enrollments cleared");

    // 2. Delete all profiles
    const { error: err2 } = await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err2) console.error("Error deleting profiles:", err2);
    else console.log("✅ Profiles cleared");

    // 3. Delete all courses (optional, but requested for full reset)
    const { error: err3 } = await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err3) console.error("Error deleting courses:", err3);
    else console.log("✅ Courses cleared");

    // 4. Delete all auth users
    let hasMore = true;
    let page = 1;
    let deletedCount = 0;
    while (hasMore) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) {
        console.error("Error fetching users:", error);
        break;
      }
      
      const users = data.users;
      if (users.length === 0) {
        hasMore = false;
        break;
      }

      for (const user of users) {
        await supabase.auth.admin.deleteUser(user.id);
        deletedCount++;
      }
    }
    console.log(`✅ Auth Users cleared (Deleted ${deletedCount} users)`);
    
    console.log("🎉 Database reset complete!");
  } catch (err) {
    console.error("Fatal error during reset:", err);
  }
}

resetDB();
