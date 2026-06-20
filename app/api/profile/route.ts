import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { userId, fullName, phone, parentPhone, role } = await req.json();

    if (!userId || !fullName) {
      return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Bypassing RLS with service_role key to upsert profile
    const { error } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      full_name: fullName,
      phone: phone,
      parent_phone: parentPhone,
      role: role || "student",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

