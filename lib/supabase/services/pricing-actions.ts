"use server";
import { verifyAdminAccess } from "@/lib/supabase/verify-admin";


import { createAdminClient } from "@/lib/supabase/client";
import type { DiscountCode, SubscriptionPrice } from "./pricing";

const PRICES_KEY = "subscription_prices";

export async function createDiscountCode(code: Partial<DiscountCode>): Promise<DiscountCode | null> {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .insert([{
      code: (code.code || "").trim().toUpperCase(),
      discount_percent: code.discountPercent ?? 0,
      max_uses: code.maxUses ?? 0,
      expiry_date: code.expiryDate || null,
      is_public: code.isPublic ?? false,
    }])
    .select()
    .single();

  if (error) {
    console.error("Error creating discount code:", error.message);
    return null;
  }

  return {
    id: data.id,
    code: data.code,
    discountPercent: data.discount_percent ?? 0,
    uses: data.uses ?? 0,
    maxUses: data.max_uses ?? 0,
    expiryDate: data.expiry_date,
    createdAt: data.created_at,
  };
}

export async function updateDiscountCode(id: string, code: Partial<DiscountCode>): Promise<boolean> {
  await verifyAdminAccess();
  const supabase = createAdminClient();

  const colMap: Record<string, any> = {
    code: code.code ? code.code.trim().toUpperCase() : undefined,
    discount_percent: code.discountPercent,
    uses: code.uses,
    max_uses: code.maxUses,
    expiry_date: code.expiryDate === undefined ? undefined : (code.expiryDate || null),
    is_public: code.isPublic,
  };
  const payload: Record<string, any> = {};
  for (const [k, v] of Object.entries(colMap)) {
    if (v !== undefined) payload[k] = v;
  }

  const { error } = await supabase
    .from("discount_codes")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("Error updating discount code:", error.message);
    return false;
  }
  return true;
}

export async function deleteDiscountCode(id: string): Promise<boolean> {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { error } = await supabase.from("discount_codes").delete().eq("id", id);
  if (error) {
    console.error("Error deleting discount code:", error.message);
    return false;
  }
  return true;
}

export async function saveSubscriptionPrices(prices: SubscriptionPrice[]): Promise<boolean> {
  await verifyAdminAccess();
  const supabase = createAdminClient();
  const { error } = await supabase.from("platform_settings").upsert(
    {
      id: PRICES_KEY,
      settings: prices as any,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("Error saving subscription prices:", error.message);
    return false;
  }
  return true;
}