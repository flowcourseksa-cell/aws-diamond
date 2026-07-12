import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export const revalidate = 0;

export async function GET() {
  try {
    const supabase = getAdminClient();

    // Get active subscriptions count
    const { count, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*", { count: "exact", head: true });

    // Get recent logs
    const { data: logs, error: logError } = await supabase
      .from("push_notifications_log")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(50);

    if (subError || logError) {
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }

    return NextResponse.json({ subscriptions: count || 0, logs: logs || [] });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
