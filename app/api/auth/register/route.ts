import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { email, password, fullName, phone, parentPhone } = await req.json();

    if (!email || !password || !fullName || !phone || !parentPhone) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    // التحقق من صحة أرقام الجوال السعودية
    const saudiPhoneRegex = /^05[0-9]{8}$/;
    if (!saudiPhoneRegex.test(phone) || !saudiPhoneRegex.test(parentPhone)) {
      return NextResponse.json({ error: "رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 1. التحقق من أن الإيميل مش متسجل مسبقاً ──
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const alreadyExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
    );

    if (alreadyExists) {
      return NextResponse.json(
        { error: "هذا الحساب مسجل لدينا بالفعل، يرجى تسجيل الدخول أو استخدام بريد آخر" },
        { status: 409 }
      );
    }

    // ── 2. إنشاء المستخدم ──
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: false, // يجبر المستخدم على تأكيد الإيميل
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || "فشل إنشاء الحساب" }, { status: 400 });
    }

    // ── 3. إنشاء الملف الشخصي مباشرة ──
    await supabaseAdmin.from("profiles").upsert({
      id: data.user.id,
      full_name: fullName.trim(),
      phone: phone.trim(),
      parent_phone: parentPhone.trim(),
      role: "student",
    });

    // ── 4. إرسال إيميل التأكيد ──
    await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email: email.trim(),
      password: password,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      },
    });

    return NextResponse.json({ user: data.user, requiresConfirmation: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
