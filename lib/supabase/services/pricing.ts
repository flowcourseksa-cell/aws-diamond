import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
export interface DiscountCode {
  id: string;
  code: string;
  discountPercent: number;
  uses: number;
  maxUses: number;
  expiryDate: string | null;
  createdAt: string;
}

// A single subscription price tier (e.g. monthly / quarterly / yearly).
export interface SubscriptionPrice {
  id: string;
  label: string;
  months: number;
  price: number;
  discountedPrice: number | null;
  isActive: boolean;
}

const PRICES_KEY = "subscription_prices";

// ---------------------------------------------------------------------
// Discount codes
// ---------------------------------------------------------------------
export async function fetchDiscountCodes(): Promise<DiscountCode[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching discount codes:", error);
    return [];
  }

  return data.map((d: any) => ({
    id: d.id,
    code: d.code,
    discountPercent: d.discount_percent ?? 0,
    uses: d.uses ?? 0,
    maxUses: d.max_uses ?? 0,
    expiryDate: d.expiry_date,
    createdAt: d.created_at,
  }));
}

export async function createDiscountCode(
  code: Partial<DiscountCode>
): Promise<DiscountCode | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .insert([
      {
        code: (code.code || "").trim().toUpperCase(),
        discount_percent: code.discountPercent ?? 0,
        max_uses: code.maxUses ?? 0,
        expiry_date: code.expiryDate || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating discount code:", error);
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

export async function updateDiscountCode(
  id: string,
  code: Partial<DiscountCode>
): Promise<boolean> {
  const supabase = createClient();

  const colMap: Record<string, any> = {
    code: code.code ? code.code.trim().toUpperCase() : undefined,
    discount_percent: code.discountPercent,
    uses: code.uses,
    max_uses: code.maxUses,
    expiry_date: code.expiryDate === undefined ? undefined : (code.expiryDate || null),
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
    console.error("Error updating discount code:", error);
    return false;
  }
  return true;
}

export async function deleteDiscountCode(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("discount_codes").delete().eq("id", id);
  if (error) {
    console.error("Error deleting discount code:", error);
    return false;
  }
  return true;
}

// Validate a code at checkout: returns the code if usable, otherwise null.
export async function validateDiscountCode(
  rawCode: string
): Promise<DiscountCode | null> {
  const supabase = createClient();
  const code = (rawCode || "").trim().toUpperCase();
  if (!code) return null;

  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) return null;

  const expired = data.expiry_date
    ? new Date(data.expiry_date) < new Date(new Date().toDateString())
    : false;
  const usedUp = data.max_uses > 0 && data.uses >= data.max_uses;
  if (expired || usedUp) return null;

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

// ---------------------------------------------------------------------
// Subscription prices (stored as a single platform_settings row)
// ---------------------------------------------------------------------
export async function fetchSubscriptionPrices(): Promise<SubscriptionPrice[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", PRICES_KEY)
    .maybeSingle();

  if (error) {
    console.error("Error fetching subscription prices:", error);
    return [];
  }
  if (!data || !Array.isArray(data.value)) return [];
  return data.value as SubscriptionPrice[];
}

export async function saveSubscriptionPrices(
  prices: SubscriptionPrice[]
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("platform_settings").upsert(
    {
      key: PRICES_KEY,
      value: prices,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("Error saving subscription prices:", error);
    return false;
  }
  return true;
}
