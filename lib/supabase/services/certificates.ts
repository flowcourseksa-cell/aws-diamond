"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

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

export async function fetchStudentCertificates(studentId: string): Promise<Certificate[]> {
  const supabase = getReadClient();
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("student_id", studentId)
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
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .order("issued_at", { ascending: false });

  if (error) return [];
  
  // Return only the highest score per student per course
  return getHighestCertificates(data as Certificate[]);
}

/** Check if a student already has a certificate for a course */
export async function fetchCertificateForCourse(
  studentId: string,
  courseId: string
): Promise<Certificate | null> {
  const supabase = getReadClient();
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .order("issued_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as Certificate;
}

/** Fetch the highest score certificate for a student in a course */
export async function fetchHighestScoreForCourse(
  studentId: string,
  courseId: string
): Promise<Certificate | null> {
  const supabase = getReadClient();
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .order("score_pct", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as Certificate;
}

/** Create a new certificate */
export async function createCertificate(data: Omit<Certificate, 'id' | 'issued_at'>): Promise<Certificate | null> {
  const supabase = getAdminClient();
  const { data: newCert, error } = await supabase
    .from("certificates")
    .insert([{
      ...data,
      issued_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error("Error creating certificate:", error);
    return null;
  }
  return newCert as Certificate;
}

/** Admin: delete a single certificate by ID */
export async function deleteCertificate(id: string): Promise<boolean> {
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
  if (ids.length === 0) return true;
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("certificates")
    .delete()
    .in("id", ids);
  if (error) { console.error("Error deleting certificates:", error); return false; }
  return true;
}
