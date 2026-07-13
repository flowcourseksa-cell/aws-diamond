"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function fetchPendingActivations() {
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  const { count, error } = await supabase
    .from("enrollments")
    .select("id", { count: 'exact', head: true })
    .eq("is_active", false);

  return count || 0;
}

export async function requestCourseActivation(
  studentId: string, 
  courseId: string, 
  studentName: string, 
  courseTitle: string,
  isPaid: boolean = false,
  finalPrice?: number,
  discountCode?: string,
  activateImmediately: boolean = false
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  // 1. Ensure profile exists (to prevent foreign key constraint violations)
  const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', studentId).single();
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
    is_active: activateImmediately, // ✅ Activates immediately if requested
    payment_status: isPaid ? 'pending' : 'free',
    final_price: finalPrice,
    discount_code: discountCode
  });

  if (insertError) {
    console.error("Enrollment failed:", insertError);
    return { success: false, error: insertError.message };
  }

  if (activateImmediately) {
    // No need to notify admins if activated immediately (or we can optionally notify them, but let's skip)
    return { success: true };
  }

  // Notify admins
  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
  if (admins && admins.length > 0) {
    const adminNotifications = admins.map(admin => ({
      user_id: admin.id,
      title: "طلب تفعيل جديد",
      message: `الطالب ${studentName || 'طالب جديد'} يطلب تفعيل دورة ${courseTitle}. يرجى مراجعة صفحة إشعارات التفعيل.`,
      type: "info"
    }));
    await supabase.from('notifications').insert(adminNotifications);
  }

  // Force Next.js to revalidate the home page so the card immediately shows "Pending" or "Active"
  revalidatePath('/');
  revalidatePath('/dashboard');

  return { success: true };
}

export async function approveActivation(enrollmentId: string, studentId: string, courseTitle: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  // 1. Update enrollment to active
  const { error: updateError } = await supabase.from("enrollments").update({ is_active: true }).eq("id", enrollmentId);
  if (updateError) return { success: false, error: updateError.message };

  // 2. Insert notification
  await supabase.from("notifications").insert({
    user_id: studentId,
    title: "تم تفعيل الدورة بنجاح",
    message: `تم تفعيل اشتراكك في دورة "${courseTitle}". يمكنك الآن الدخول والبدء في التعلم!`,
    type: "success"
  });

  return { success: true };
}

export async function rejectActivation(enrollmentId: string, studentId: string, courseTitle: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  // 1. Delete enrollment
  const { error: deleteError } = await supabase.from("enrollments").delete().eq("id", enrollmentId);
  if (deleteError) return { success: false, error: deleteError.message };

  // 2. Insert notification
  await supabase.from("notifications").insert({
    user_id: studentId,
    title: "تم رفض طلب التفعيل",
    message: `عذراً، تم رفض طلب تفعيل دورتك "${courseTitle}". يرجى التواصل مع الإدارة.`,
    type: "rejected"
  });

  return { success: true };
}