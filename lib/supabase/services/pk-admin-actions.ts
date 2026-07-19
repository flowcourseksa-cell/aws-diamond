"use server";
import { verifyAdminAccess } from "@/lib/supabase/verify-admin";
import { createAdminClient } from "@/lib/supabase/client";
import { type PkQuestion } from "./pk-actions";

export async function adminFetchPkQuestions(): Promise<PkQuestion[]> {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("pk_questions")
    .select("*")
    .order("created_at", { ascending: false });
  return (data || []) as PkQuestion[];
}

export async function adminCreatePkQuestion(
  q: Omit<PkQuestion, "id" | "created_at">
): Promise<boolean> {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { error } = await supabase.from("pk_questions").insert([q]);
  if (error) {
    console.error("adminCreatePkQuestion:", error.message);
    return false;
  }
  return true;
}

export async function adminUpdatePkQuestion(
  id: string,
  q: Partial<Omit<PkQuestion, "id" | "created_at">>
): Promise<boolean> {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { error } = await supabase.from("pk_questions").update(q).eq("id", id);
  return !error;
}

export async function adminDeletePkQuestion(id: string): Promise<boolean> {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { error } = await supabase.from("pk_questions").delete().eq("id", id);
  return !error;
}
