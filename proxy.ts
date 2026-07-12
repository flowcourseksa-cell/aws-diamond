import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // 1. Skip Supabase auth checks completely for background prefetches to save DB hits
  if (request.headers.get('x-middleware-prefetch') || request.headers.get('purpose') === 'prefetch') {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 2. Use getUser() which validates the token with the Supabase Auth server.
  // This is the trusted check for protecting routes; getSession() only reads the
  // local cookie and can be spoofed, so it must not be used for authorization.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/lessons") ||
    pathname.startsWith("/exams") ||
    pathname.startsWith("/library") ||
    pathname.startsWith("/performance") ||
    pathname.startsWith("/study-plan") ||
    pathname.startsWith("/tracks") ||
    pathname.startsWith("/onboarding");

  // Admin area: require an authenticated session at the edge.
  // The admin role itself is enforced server-side (admin shell + RLS).
  const isAdminArea = pathname.includes("admin-khaled-ksa-aws-2026-org");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (!user && isAdminArea) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
