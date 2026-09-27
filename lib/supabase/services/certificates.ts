"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { verifyAdminAccess, currentUserId } from "@/lib/supabase/verify-admin";

function getReadClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type Certificate = {
  id: string;
  student_id: string;
  course_id: string;
  final_exam_id: string | null;
  score_pct: number;
  student_name: string;
  course_title: string;
  issued_at: string;
};

/** Utility: Keep only the highest score certificate per student per course */
function getHighestCertificates(certs: Certificate[]): Certificate[] {
  const map = new Map<string, Certificate>();
  
  for (const cert of certs) {
    const key = `${cert.student_id}-${cert.course_id || cert.course_title}`;
    const existing = map.get(key);
    if (!existing || cert.score_pct > existing.score_pct) {
      map.set(key, cert);
    }
  }
  
  return Array.from(map.values());
}

/** Student: own certificates only. The student id is taken from the session, never from the client. */
export async function fetchStudentCertificates(_studentId: string): Promise<Certificate[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  const supabase = getReadClient();
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("student_id", userId)
    .order("issued_at", { ascending: false });

  if (error) return [];
  
  // Filter out simulator/practice certificates from the main certificates list
  const SIMULATOR_NAMES = ["محاكي الأوس الماسية", "STEP Simulator", "اختبار الستيب", "محاكي"];
  const validCertificates = (data as Certificate[]).filter(cert => {
    return !SIMULATOR_NAMES.some(name => cert.course_title?.includes(name));
  });

  return getHighestCertificates(validCertificates);
}

/** Public: fetch a certificate by ID (no auth needed) */
export async function fetchCertificateById(id: string): Promise<Certificate | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Certificate;
}

/** Admin: fetch all issued certificates */
export async function fetchAllCertificates(): Promise<Certificate[]> {
  await verifyAdminAccess();
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .order("issued_at", { ascending: false });

  if (error) return [];
  
  // Return only the highest score per student per course
  return getHighestCertificates(data as Certificate[]);
}

/** Check if the session user already has a certificate for a course (client-supplied student id is ignored) */
export async function fetchCertificateForCourse(
  _studentId: string,
  courseId: string
): Promise<Certificate | null> {
  const userId = await currentUserId();
  if (!userId) return null;
  const supabase = getReadClient();
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("student_id", userId)
    .eq("course_id", courseId)
    .order("issued_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as Certificate;
}

/** Fetch the session user's highest score certificate in a course (client-supplied student id is ignored) */
export async function fetchHighestScoreForCourse(
  _studentId: string,
  courseId: string
): Promise<Certificate | null> {
  const userId = await currentUserId();
  if (!userId) return null;
  const supabase = getReadClient();
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("student_id", userId)
    .eq("course_id", courseId)
    .order("score_pct", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as Certificate;
}

/** Create a new certificate — always issued to the session user (client-supplied student_id is ignored) */
// إصدار الشهادات لم يعد إجراء خادم عاماً: يتم فقط من داخل gradeSimulatorAttempt عبر lib/supabase/services/certificates-internal.ts

/** Admin: delete a single certificate by ID */
export async function deleteCertificate(id: string): Promise<boolean> {
  await verifyAdminAccess();
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("certificates")
    .delete()
    .eq("id", id);
  if (error) { console.error("Error deleting certificate:", error); return false; }
  return true;
}

/** Admin: delete multiple certificates by IDs */
export async function deleteMultipleCertificates(ids: string[]): Promise<boolean> {
  await verifyAdminAccess();
  if (ids.length === 0) return true;
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("certificates")
    .delete()
    .in("id", ids);
  if (error) { console.error("Error deleting certificates:", error); return false; }
  return true;
}
