"use server";

import { createClient } from "@supabase/supabase-js";

export async function createStudentByAdmin(data: {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return { success: false, error: "Missing Supabase configuration." };
  }

  // Create an admin client bypassing RLS and avoiding local session updates
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password || "123456", // default simple password if none provided
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
      },
    });

    if (authError) {
      console.error("Error creating user:", authError.message);
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: "User creation failed." };
    }

    // The trigger automatically inserts into profiles.
    // If phone number is provided, update the profile.
    if (data.phone) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ phone: data.phone })
        .eq("id", authData.user.id);
        
      if (profileError) {
        console.error("Error updating phone:", profileError.message);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error("Server action error:", err);
    return { success: false, error: err.message || "Unknown error" };
  }
}
