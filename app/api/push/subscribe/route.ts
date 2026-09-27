// app/api/push/subscribe/route.ts
// تسجيل/إلغاء اشتراك إشعارات الدفع (Web Push) للمستخدم الحالي فقط.
// هوية الطالب تُؤخذ من جلسة Supabase (الكوكيز) لا من جسم الطلب، حتى لا يستطيع أحد تسجيل نقطة اشتراك
// باسم طالب آخر أو حذف اشتراكات غيره. الكتابة بمفتاح الخدمة (كما كانت) مع تقييد كل عملية بهوية الجلسة.
import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "@/lib/supabase/server";

const MAX_ENDPOINT_LENGTH = 2048;
const MAX_KEY_LENGTH = 512;

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

async function currentUserId(): Promise<string | null> {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function readJson(req: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function isValidEndpoint(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_ENDPOINT_LENGTH && /^https:\/\/[^\s]+$/.test(value);
}

function isValidKey(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_KEY_LENGTH;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });

    const body = await readJson(req);
    const subscription = body?.subscription as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | undefined;
    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh;
    const auth = subscription?.keys?.auth;
    if (!isValidEndpoint(endpoint) || !isValidKey(p256dh) || !isValidKey(auth)) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const supabase = getAdminClient();
    // نقطة الاشتراك فريدة لكل متصفح؛ إن وُجدت لطالب آخر (جهاز مشترك) تنتقل إلى المستخدم الحالي
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert({ student_id: userId, endpoint, p256dh, auth }, { onConflict: "endpoint" });

    if (error) {
      console.error("Push subscribe error:", error);
      return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });

    const body = await readJson(req);
    const endpoint = body?.endpoint;
    if (!isValidEndpoint(endpoint)) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });

    const supabase = getAdminClient();
    // يحذف اشتراك المستخدم الحالي فقط
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)
      .eq("student_id", userId);
    if (error) {
      console.error("Push unsubscribe error:", error);
      return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Push unsubscribe error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
