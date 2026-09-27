"use server";

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sendPlatformNotification } from "@/lib/notifications/server-push";
import { revalidatePath } from 'next/cache';
import { verifyAdminAccess, verifySuperAdminAccess, requireUserId } from "@/lib/supabase/verify-admin";

export async function fetchPendingActivations() {
  // إجراء إداري: يعيد [] لغير المديرين (عقد الدالة يعيد [] عند الفشل)
  try {
    await verifySuperAdminAccess();
  } catch (err: any) {
    console.error("fetchPendingActivations:", err?.message || "غير مصرح لك");
    return [];
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from("enrollments")
    .select(`
      id, enrolled_at, payment_status, discount_code, final_price,
      student_id, course_id,
      profiles ( full_name ),
      courses ( title, price )
    `)
    .eq("is_active", false);

  if (error) {
    console.error("Error fetching activations:", error);
    return [];
  }

  return (data || []).map((e: any) => ({
    enrollment_id: e.id,
    student_id: e.student_id,
    course_id: e.course_id,
    student_name: e.profiles?.full_name || "طالب غير معروف",
    student_code: `TKH-${e.student_id.split('-')[0].toUpperCase()}`,
    course_title: e.courses?.title || "دورة محذوفة",
    course_price: e.courses?.price || 0,
    payment_status: e.payment_status || 'free',
    discount_code: e.discount_code,
    final_price: e.final_price,
    created_at: e.enrolled_at,
  }));
}

export async function fetchPendingCount() {
  // إجراء إداري: يعيد 0 لغير المديرين (عقد الدالة يعيد 0 عند الفشل)
  try {
    await verifyAdminAccess();
  } catch {
    return 0;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  const { count, error } = await supabase
    .from("enrollments")
    .select("id", { count: 'exact', head: true })
    .eq("is_active", false);

  return count || 0;
}

/**
 * إجراء خاص بالطالب (session-bound): يعمل دائماً على حساب صاحب الجلسة.
 * المعرّف والعلم activateImmediately والسعر وحالة الدفع وعنوان الدورة القادمة من العميل تُتجاهل،
 * وتُحسب على الخادم من الجلسة ومن صف الدورة في قاعدة البيانات (التوقيع ثابت حتى لا يتغير المستدعون).
 */
export async function requestCourseActivation(
  _studentId: string,
  courseId: string,
  studentName: string,
  _courseTitle: string,
  _isPaid: boolean = false,
  _finalPrice?: number,
  discountCode?: string,
  _activateImmediately: boolean = false
) {
  let studentId: string;
  try {
    studentId = await requireUserId();
  } catch (err: any) {
    return { success: false, error: err?.message || "غير مصرح لك" };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  // 0. Server-side truth about the course (price / activation policy / title) — never trust the client for these
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, price, discounted_price, description')
    .eq('id', courseId)
    .single();
  if (courseError || !course) {
    return { success: false, error: "الدورة غير موجودة" };
  }

  let meta: any = {};
  try {
    if (course.description && course.description.startsWith("{")) meta = JSON.parse(course.description);
  } catch {
    // Not JSON, ignore
  }
  const requireWhatsappActivation: boolean = meta.requireWhatsappActivation ?? true;
  // Same rule as the course page: free == discounted price is exactly 0
  const isFree = course.discounted_price === 0;
  const isPaid = !isFree;
  const activateImmediately = isFree && requireWhatsappActivation === false;
  const courseTitle: string = course.title || 'الدورة';

  // Recompute the expected price on the server (mirrors the course page / validateDiscountCode)
  const currentPrice: number = Number(course.discounted_price ?? course.price ?? 0);
  let finalPrice: number = currentPrice;
  let appliedCode: string | undefined = undefined;
  if (isPaid && discountCode) {
    const code = discountCode.trim().toUpperCase();
    const { data: dc } = await supabase
      .from('discount_codes')
      .select('code, discount_percent, uses, max_uses, expiry_date')
      .eq('code', code)
      .maybeSingle();
    if (dc) {
      const expired = dc.expiry_date ? new Date(dc.expiry_date) < new Date(new Date().toDateString()) : false;
      const usedUp = (dc.max_uses ?? 0) > 0 && (dc.uses ?? 0) >= (dc.max_uses ?? 0);
      if (!expired && !usedUp) {
        appliedCode = dc.code;
        finalPrice = currentPrice - (currentPrice * (dc.discount_percent ?? 0) / 100);
      }
    }
  }

  // 1. Ensure profile exists (to prevent foreign key constraint violations)
  const { data: existingProfile } = await supabase.from('profiles').select('id, full_name').eq('id', studentId).single();
  const displayName: string = existingProfile?.full_name || studentName || 'طالب جديد';
  if (!existingProfile) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: studentId,
      full_name: studentName || 'طالب جديد',
      role: 'student'
    });
    if (profileError) {
      console.error("Failed to create missing profile:", profileError);
    }
  }

  // Insert pending (or active) enrollment
  const { error: insertError } = await supabase.from('enrollments').insert({
    student_id: studentId,
    course_id: courseId,
    is_active: activateImmediately, // ✅ Activates immediately only when the course policy allows it (server-derived)
    payment_status: isPaid ? 'pending' : 'free',
    final_price: finalPrice,
    discount_code: appliedCode
  });

  if (insertError) {
    console.error("Enrollment failed:", insertError);
    return { success: false, error: insertError.message };
  }

  if (activateImmediately) {
    // No need to notify admins if activated immediately (or we can optionally notify them, but let's skip)
    return { success: true, activated: true };
  }

  // Notify admins
  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
  if (admins && admins.length > 0) {
    const adminNotifications = admins.map(admin => ({
      user_id: admin.id,
      title: "طلب تفعيل جديد",
      message: `الطالب ${displayName} يطلب تفعيل دورة ${courseTitle}. يرجى مراجعة صفحة إشعارات التفعيل.`,
      type: "info"
    }));
    await supabase.from('notifications').insert(adminNotifications);
  }

  // Force Next.js to revalidate the home page so the card immediately shows "Pending" or "Active"
  revalidatePath('/');
  revalidatePath('/dashboard');

  return { success: true, activated: false };
}

export async function approveActivation(enrollmentId: string, studentId: string, courseTitle: string) {
  try {
    await verifySuperAdminAccess();
  } catch (err: any) {
    return { success: false, error: err?.message || "غير مصرح لك" };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  // 1. Update enrollment to active
  const { error: updateError } = await supabase.from("enrollments").update({ is_active: true }).eq("id", enrollmentId);
  if (updateError) return { success: false, error: updateError.message };

  // 2. Insert notification & send web push
  await sendPlatformNotification(supabase, {
    userIds: [studentId],
    title: "تم تفعيل الدورة بنجاح",
    message: `تم تفعيل اشتراكك في دورة "${courseTitle}". يمكنك الآن الدخول والبدء في التعلم!`,
    type: "success",
    url: "/dashboard"
  });

  return { success: true };
}

export async function rejectActivation(enrollmentId: string, studentId: string, courseTitle: string) {
  try {
    await verifySuperAdminAccess();
  } catch (err: any) {
    return { success: false, error: err?.message || "غير مصرح لك" };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  // 1. Delete enrollment
  const { error: deleteError } = await supabase.from("enrollments").delete().eq("id", enrollmentId);
  if (deleteError) return { success: false, error: deleteError.message };

  // 2. Insert notification & send web push
  await sendPlatformNotification(supabase, {
    userIds: [studentId],
    title: "تم رفض طلب التفعيل",
    message: `عذراً، تم رفض طلب تفعيل دورتك "${courseTitle}". يرجى التواصل مع الإدارة.`,
    type: "rejected",
    url: "/dashboard"
  });

  return { success: true };
}