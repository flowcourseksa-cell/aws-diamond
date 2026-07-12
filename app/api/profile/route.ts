import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { userId, fullName, phone, parentPhone, role } = await req.json();

    if (!userId || !fullName) {
      return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
    }

    // Authenticate the caller
    const cookieStore = await cookies();
    const supabaseClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
    }

    // Verify if caller is the owner OR an admin
    let isAdmin = false;
    const { data: callerProfile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (callerProfile?.role === "admin") {
      isAdmin = true;
    }

    if (user.id !== userId && !isAdmin) {
      return NextResponse.json({ error: "غير مصرح لك بتعديل بيانات مستخدم آخر" }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Only admins can change roles
    const safeRole = isAdmin && role ? role : "student";

    // Bypassing RLS with service_role key to upsert profile
    const { error } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      full_name: fullName,
      phone: phone,
      parent_phone: parentPhone,
      role: safeRole,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Update user metadata as well to keep auth.users in sync
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { full_name: fullName, name: fullName }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
