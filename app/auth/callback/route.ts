import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
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
          } catch {
            // Edge runtime — cookies can't be set in some contexts
          }
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  const user = data.session.user;

  // Check if user has a profile. If not, redirect to onboarding.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, parent_phone")
    .eq("id", user.id)
    .single();

  // السماح بالمرور لصفحة تغيير كلمة المرور حتى لو لم يكتمل الملف
  if (next.startsWith("/reset-password")) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (!profile || !profile.parent_phone) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  const isAdmin = profile.role === "admin";
  const destination = isAdmin ? "/admin-khaled-ksa-aws-2026-org" : "/";

  return NextResponse.redirect(`${origin}${destination}`);
}
